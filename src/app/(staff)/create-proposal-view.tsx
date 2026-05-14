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
import SendProposalDialog from "@/components/proposal/send-proposal-dialog";
import type { Json } from "@/lib/supabase/types";

interface ProposalState {
  playerName: string;
  playerEmail: string;
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
  // Read-only metadata loaded from the DB once the proposal exists.
  reference: string;
  preparedByName: string;
  preparedByEmail: string;
  sentAt: string | null;
  signedAt: string | null;
}

const defaultState: ProposalState = {
  playerName: "",
  playerEmail: "",
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
  reference: "",
  preparedByName: "",
  preparedByEmail: "",
  sentAt: null,
  signedAt: null,
};

export default function CreateProposalView() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const editIdFromUrl = searchParams.get("editId");
  const [activeTab, setActiveTab] = useState("Edit");
  const [state, setState] = useState<ProposalState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [persistedId, setPersistedId] = useState<string | null>(editIdFromUrl);
  const [sendOpen, setSendOpen] = useState(false);

  useQuery({
    queryKey: ["proposal", editIdFromUrl],
    enabled: !!editIdFromUrl && !loaded,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", editIdFromUrl!)
        .single();
      if (error) throw error;
      setState({
        playerName: data.player_name,
        playerEmail: data.player_email,
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
        reference: data.reference,
        preparedByName: data.prepared_by_name,
        preparedByEmail: data.prepared_by_email,
        sentAt: data.sent_at,
        signedAt: data.signed_at,
      });
      setPersistedId(data.id);
      setLoaded(true);
      return data;
    },
  });

  const update = useCallback(
    <K extends keyof ProposalState>(field: K, value: ProposalState[K]) => {
      setState((s) => ({ ...s, [field]: value }));
    },
    [],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Pull the signed-in user so we can attribute the proposal to them.
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      const preparedByEmail = user?.email ?? "";
      const preparedByName =
        (user?.user_metadata?.full_name as string | undefined) ||
        (user?.user_metadata?.name as string | undefined) ||
        (preparedByEmail ? preparedByEmail.split("@")[0] : "");

      const payload = {
        player_name: state.playerName,
        player_email: state.playerEmail,
        deal_duration: state.dealDuration,
        items: state.items as unknown as Json,
        discount_percent: state.discountPercent,
        cash_incentive: state.cashIncentive,
        clauses: state.clauses as unknown as Json,
        ai_image_rights: state.aiImageRights,
        photo_provisions: state.photoProvisions,
        terms: state.selectedTerms as unknown as Json,
        notes: state.notes,
      };

      if (persistedId) {
        const { data: current } = await supabase
          .from("proposals")
          .select("version, prepared_by_name, prepared_by_email")
          .eq("id", persistedId)
          .single();
        // Only set prepared_by on first save (don't overwrite if another staff
        // member opens an existing proposal to make changes).
        const preparedByPatch =
          current?.prepared_by_email
            ? {}
            : { prepared_by_name: preparedByName, prepared_by_email: preparedByEmail };
        const { error } = await supabase
          .from("proposals")
          .update({
            ...payload,
            ...preparedByPatch,
            version: (current?.version ?? 1) + 1,
          })
          .eq("id", persistedId);
        if (error) throw error;
        return persistedId;
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert({
            ...payload,
            prepared_by_name: preparedByName,
            prepared_by_email: preparedByEmail,
          })
          .select("id")
          .single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (id) => {
      setPersistedId(id);
      toast({ title: persistedId ? "Proposal updated" : "Proposal saved" });
      if (!editIdFromUrl) {
        router.replace(`/?editId=${id}`);
      }
    },
    onError: (e: Error) => {
      toast({
        title: "Error saving",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const handleSend = async () => {
    if (!persistedId) {
      try {
        await saveMutation.mutateAsync();
      } catch {
        return;
      }
    } else {
      saveMutation.mutate();
    }
    setSendOpen(true);
  };

  useEffect(() => {
    window.__proposalActions = {
      save: () => saveMutation.mutate(),
      email: handleSend,
      printPdf: () => setActiveTab("Print PDF"),
      isSaving: saveMutation.isPending,
    };
    return () => {
      window.__proposalActions = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, persistedId, saveMutation.isPending]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {persistedId ? "Edit Proposal" : "Create Proposal"}
        </h1>
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "Edit" && (
        <div className="space-y-4">
          <PlayerDetailsCard
            playerName={state.playerName}
            playerEmail={state.playerEmail}
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
          <NotesCard notes={state.notes} onChange={(n) => update("notes", n)} />
        </div>
      )}

      {activeTab === "Preview" && <ProposalPreview {...state} />}

      {activeTab === "Print PDF" && <ProposalPrintView {...state} />}

      <SendProposalDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        proposalId={persistedId}
        initialEmail={state.playerEmail}
      />
    </div>
  );
}
