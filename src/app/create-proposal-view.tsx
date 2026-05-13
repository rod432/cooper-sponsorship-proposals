"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TabSwitcher from "@/components/proposal/tab-switcher";
import PlayerDetailsCard from "@/components/proposal/player-details-card";
import EquipmentCatalogCard, {
  type ProposalItem,
} from "@/components/proposal/equipment-catalog-card";
import FinancialSummaryCard from "@/components/proposal/financial-summary-card";
import ClausesCard from "@/components/proposal/clauses-card";
import AIImageRightsCard from "@/components/proposal/ai-image-rights-card";
import PhotoProvisionsCard from "@/components/proposal/photo-provisions-card";
import StandardTermsCard, {
  type SelectedTerm,
} from "@/components/proposal/standard-terms-card";
import CustomTermsCard from "@/components/proposal/custom-terms-card";
import NotesCard from "@/components/proposal/notes-card";
import ProposalPreview from "@/components/proposal/proposal-preview";
import ProposalPrintView from "@/components/proposal/proposal-print-view";
import type { Json } from "@/lib/supabase/types";

interface ProposalState {
  playerName: string;
  dealDuration: string;
  items: ProposalItem[];
  discountPercent: number;
  cashIncentive: number;
  clauses: string[];
  aiImageRights: boolean;
  photoProvisions: boolean;
  selectedTerms: SelectedTerm[];
  customTerms: string[];
  notes: string;
}

const defaultState: ProposalState = {
  playerName: "",
  dealDuration: "",
  items: [],
  discountPercent: 0,
  cashIncentive: 0,
  clauses: [],
  aiImageRights: false,
  photoProvisions: false,
  selectedTerms: [],
  customTerms: [],
  notes: "",
};

export default function CreateProposalView() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const [activeTab, setActiveTab] = useState("Edit");
  const [state, setState] = useState<ProposalState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useQuery({
    queryKey: ["proposal", editId],
    enabled: !!editId && !loaded,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", editId!)
        .single();
      if (error) throw error;
      setState({
        playerName: data.player_name,
        dealDuration: data.deal_duration,
        items: (data.items as unknown as ProposalItem[]).map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
        })),
        discountPercent: Number(data.discount_percent),
        cashIncentive: Number(data.cash_incentive),
        clauses: data.clauses as unknown as string[],
        aiImageRights: data.ai_image_rights,
        photoProvisions: data.photo_provisions,
        selectedTerms: (data.terms as unknown as SelectedTerm[]) ?? [],
        customTerms: [],
        notes: data.notes,
      });
      setLoaded(true);
      return data;
    },
  });

  const update = useCallback(<K extends keyof ProposalState>(field: K, value: ProposalState[K]) => {
    setState((s) => ({ ...s, [field]: value }));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        player_name: state.playerName,
        deal_duration: state.dealDuration,
        items: state.items as unknown as Json,
        discount_percent: state.discountPercent,
        cash_incentive: state.cashIncentive,
        clauses: state.clauses as unknown as Json,
        ai_image_rights: state.aiImageRights,
        photo_provisions: state.photoProvisions,
        terms: state.selectedTerms as unknown as Json,
        notes: state.notes,
        updated_at: new Date().toISOString(),
      };

      if (editId) {
        const { data: current } = await supabase
          .from("proposals")
          .select("version")
          .eq("id", editId)
          .single();
        const { error } = await supabase
          .from("proposals")
          .update({ ...payload, version: (current?.version ?? 1) + 1 })
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("proposals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? "Proposal updated" : "Proposal saved" });
      router.push("/proposals");
    },
    onError: (e: Error) => {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const subject = encodeURIComponent(
      `Cooper Cricket Sponsorship Proposal - ${state.playerName}`,
    );
    const body = encodeURIComponent(
      `Hi,\n\nPlease find attached the sponsorship proposal for ${state.playerName}.\n\nKind regards,\nCooper Cricket`,
    );
    const handleEmail = () => {
      window.open(`mailto:?subject=${subject}&body=${body}`);
    };
    window.__proposalActions = {
      save: () => saveMutation.mutate(),
      email: handleEmail,
      isSaving: saveMutation.isPending,
    };
    return () => {
      window.__proposalActions = undefined;
    };
  }, [state.playerName, saveMutation]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {editId ? "Edit Proposal" : "Create Proposal"}
        </h1>
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "Edit" && (
        <div className="space-y-4">
          <PlayerDetailsCard
            playerName={state.playerName}
            dealDuration={state.dealDuration}
            onChange={(f, v) =>
              update(f as keyof ProposalState, v as ProposalState[keyof ProposalState])
            }
          />
          <EquipmentCatalogCard
            items={state.items}
            onChange={(items) => update("items", items)}
          />
          <FinancialSummaryCard
            items={state.items}
            discountPercent={state.discountPercent}
            cashIncentive={state.cashIncentive}
            onChange={(f, v) =>
              update(f as keyof ProposalState, v as ProposalState[keyof ProposalState])
            }
          />
          <ClausesCard
            clauses={state.clauses}
            onChange={(c) => update("clauses", c)}
          />
          <AIImageRightsCard
            checked={state.aiImageRights}
            onChange={(v) => update("aiImageRights", v)}
          />
          <PhotoProvisionsCard
            checked={state.photoProvisions}
            onChange={(v) => update("photoProvisions", v)}
          />
          <StandardTermsCard
            selectedTerms={state.selectedTerms}
            onChange={(t) => update("selectedTerms", t)}
          />
          <CustomTermsCard
            terms={state.customTerms}
            onChange={(t) => update("customTerms", t)}
          />
          <NotesCard
            notes={state.notes}
            onChange={(n) => update("notes", n)}
          />
        </div>
      )}

      {activeTab === "Preview" && <ProposalPreview {...state} />}

      {activeTab === "Print PDF" && <ProposalPrintView {...state} />}
    </div>
  );
}
