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
import RecipientsCard, {
  type AdditionalRecipient,
} from "@/components/proposal/recipients-card";
import ProposalPreview from "@/components/proposal/proposal-preview";
import SendTab from "@/components/proposal/send-tab";
import SendProposalDialog from "@/components/proposal/send-proposal-dialog";
import PreparedByDialog, {
  type PreparedBy,
} from "@/components/proposal/prepared-by-dialog";
import { Button } from "@/components/ui/button";
import { Eye, Mail, Save, Settings } from "lucide-react";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  type Amendment,
} from "@/lib/proposal-totals";
import type { Json, TablesUpdate } from "@/lib/supabase/types";

interface ProposalState {
  playerName: string;
  playerEmail: string;
  dealDuration: string;
  isUnder18: boolean;
  additionalRecipients: AdditionalRecipient[];
  items: ProposalItem[];
  discountPercent: number;
  cashIncentive: number;
  cashPerYear: boolean;
  earlyExitFee: number;
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
  preparedByRole: string;
  preparedByPhone: string;
  sentAt: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  signedName: string | null;
  parentSignedName: string | null;
  publicToken: string | null;
  status: string;
  amendments: Amendment[];
}

const defaultState: ProposalState = {
  playerName: "",
  playerEmail: "",
  dealDuration: "",
  isUnder18: false,
  additionalRecipients: [],
  items: [],
  discountPercent: 0,
  cashIncentive: 0,
  cashPerYear: false,
  earlyExitFee: 0,
  clauses: [],
  aiImageRights: false,
  photoProvisions: false,
  selectedTerms: [],
  customTerms: [],
  notes: "",
  reference: "",
  preparedByName: "",
  preparedByEmail: "",
  preparedByRole: "",
  preparedByPhone: "",
  sentAt: null,
  signedAt: null,
  expiresAt: null,
  signedName: null,
  parentSignedName: null,
  publicToken: null,
  status: "draft",
  amendments: [],
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
  const [preparedByOpen, setPreparedByOpen] = useState(false);
  const [amendmentNote, setAmendmentNote] = useState("");

  // True once the proposal has at least one signature on file.
  const isSigned =
    state.status === "approved" || state.status === "partially_signed";
  // True until the user has explicitly chosen a Prepared-by — once they do
  // (or once we load an existing proposal), we stop auto-overwriting from
  // the signed-in user's profile.
  const [preparedByPristine, setPreparedByPristine] = useState(!editIdFromUrl);

  // For a brand-new proposal, pre-fill Prepared-by from the signed-in user's
  // staff profile. Stops once the user picks someone else via the cog dialog
  // or once they save.
  useEffect(() => {
    if (editIdFromUrl) return; // existing proposal handled by useQuery below
    if (!preparedByPristine) return;
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("full_name, role, phone, email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const fallbackName = user.email ? user.email.split("@")[0] : "";
      setState((s) => ({
        ...s,
        preparedByName: profile?.full_name || fallbackName,
        preparedByEmail: profile?.email || user.email || "",
        preparedByRole: profile?.role || "",
        preparedByPhone: profile?.phone || "",
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [editIdFromUrl, preparedByPristine]);

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
        isUnder18: data.signed_under_18,
        additionalRecipients:
          (data.additional_recipients as unknown as AdditionalRecipient[]) ?? [],
        items: (data.items as unknown as ProposalItem[]).map((item) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
        })),
        discountPercent: Number(data.discount_percent),
        cashIncentive: Number(data.cash_incentive),
        cashPerYear: data.cash_per_year ?? false,
        earlyExitFee: Number(data.early_exit_fee ?? 0),
        clauses: data.clauses as unknown as string[],
        aiImageRights: data.ai_image_rights,
        photoProvisions: data.photo_provisions,
        selectedTerms: (data.terms as unknown as SelectedTerm[]) ?? [],
        customTerms: [],
        notes: data.notes,
        reference: data.reference,
        preparedByName: data.prepared_by_name,
        preparedByEmail: data.prepared_by_email,
        preparedByRole: data.prepared_by_role,
        preparedByPhone: data.prepared_by_phone,
        sentAt: data.sent_at,
        signedAt: data.signed_at,
        expiresAt: data.expires_at,
        signedName: data.signed_name,
        parentSignedName: data.parent_signed_name,
        publicToken: data.public_token,
        status: data.status,
        amendments: (data.amendments as unknown as Amendment[]) ?? [],
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
      // Prepared-by comes straight from state. It was pre-filled from the
      // signed-in user's staff_profile on first load; staff can override via
      // the cog dialog before saving.
      // Strip empty rows so we don't try to send to "".
      const cleanedRecipients = state.additionalRecipients.filter((r) =>
        r.email.trim().includes("@"),
      );

      const payload = {
        player_name: state.playerName,
        player_email: state.playerEmail,
        deal_duration: state.dealDuration,
        signed_under_18: state.isUnder18,
        additional_recipients: cleanedRecipients as unknown as Json,
        items: state.items as unknown as Json,
        discount_percent: state.discountPercent,
        cash_incentive: state.cashIncentive,
        cash_per_year: state.cashPerYear,
        early_exit_fee: state.earlyExitFee,
        clauses: state.clauses as unknown as Json,
        ai_image_rights: state.aiImageRights,
        photo_provisions: state.photoProvisions,
        terms: state.selectedTerms as unknown as Json,
        notes: state.notes,
        prepared_by_name: state.preparedByName,
        prepared_by_email: state.preparedByEmail,
        prepared_by_role: state.preparedByRole,
        prepared_by_phone: state.preparedByPhone,
      };

      if (persistedId) {
        const { data: current } = await supabase
          .from("proposals")
          .select("version, status, signed_name, signed_at")
          .eq("id", persistedId)
          .single();
        const wasSigned =
          current?.status === "approved" || current?.status === "partially_signed";

        let updatePayload: TablesUpdate<"proposals"> = {
          ...payload,
          version: (current?.version ?? 1) + 1,
        };

        if (wasSigned) {
          // Editing a signed agreement = an amendment. Record it, clear the
          // signatures and re-open it for re-signing so the signature always
          // matches the document.
          const nowIso = new Date().toISOString();
          const entry: Amendment = {
            at: nowIso,
            note: amendmentNote.trim() || "Proposal amended",
            priorSignedName: current?.signed_name ?? null,
            priorSignedAt: current?.signed_at ?? null,
          };
          updatePayload = {
            ...updatePayload,
            amendments: [...state.amendments, entry] as unknown as Json,
            status: "amended",
            signed_name: null,
            signed_at: null,
            player_signed_name: null,
            player_signed_at: null,
            parent_signed_name: null,
            parent_signed_at: null,
            expires_at: null,
          };
        }

        const { error } = await supabase
          .from("proposals")
          .update(updatePayload)
          .eq("id", persistedId);
        if (error) throw error;
        return { id: persistedId, amended: wasSigned };
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        return { id: data.id, amended: false };
      }
    },
    onSuccess: (res) => {
      setPersistedId(res.id);
      if (res.amended) {
        const nowIso = new Date().toISOString();
        setState((s) => ({
          ...s,
          status: "amended",
          signedName: null,
          parentSignedName: null,
          signedAt: null,
          expiresAt: null,
          amendments: [
            ...s.amendments,
            {
              at: nowIso,
              note: amendmentNote.trim() || "Proposal amended",
              priorSignedName: s.signedName,
              priorSignedAt: s.signedAt,
            },
          ],
        }));
        setAmendmentNote("");
        toast({
          title: "Amendment saved",
          description: "The player needs to re-sign. Re-send them the link.",
        });
        setSendOpen(true);
        return;
      }
      toast({ title: persistedId ? "Proposal updated" : "Proposal saved" });
      if (!editIdFromUrl) {
        router.replace(`/?editId=${res.id}`);
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
      printPdf: () => setActiveTab("Send"),
      isSaving: saveMutation.isPending,
    };
    return () => {
      window.__proposalActions = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, persistedId, saveMutation.isPending]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {persistedId ? "Edit Proposal" : "Create Proposal"}
            </h1>
            <button
              type="button"
              onClick={() => setPreparedByOpen(true)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              title="Change who this proposal is from"
              aria-label="Change Prepared by"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="text-muted-foreground">From:</span>
            <button
              type="button"
              onClick={() => setPreparedByOpen(true)}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {state.preparedByName || "Not set"}
              {state.preparedByRole ? ` · ${state.preparedByRole}` : ""}
            </button>
            {persistedId && state.reference && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="font-mono text-muted-foreground">
                  {state.reference}
                </span>
              </>
            )}
            {persistedId && state.status !== "draft" && (
              <span
                className={`rounded-full px-2 py-0.5 font-medium ${
                  STATUS_BADGE_CLASSES[state.status] ?? "bg-muted text-muted-foreground"
                }`}
              >
                {STATUS_LABELS[state.status] ?? state.status}
              </span>
            )}
          </div>
        </div>
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "Edit" && (
        <div className="space-y-4">
          {isSigned && (
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
              <p className="font-heading text-sm font-semibold text-foreground">
                This agreement is already signed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Any change you save will be recorded as an amendment and the player (and
                parent/guardian, if under 18) will need to re-sign. The original signature is kept in
                the history.
              </p>
              <label className="mt-3 block text-xs font-medium text-foreground">
                What is changing? (recorded on the agreement)
                <input
                  type="text"
                  value={amendmentNote}
                  onChange={(e) => setAmendmentNote(e.target.value)}
                  placeholder="e.g. Added a playing bag at no charge"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}
          <PlayerDetailsCard
            playerName={state.playerName}
            playerEmail={state.playerEmail}
            dealDuration={state.dealDuration}
            isUnder18={state.isUnder18}
            onChange={(f, v) =>
              update(f as keyof ProposalState, v as ProposalState[keyof ProposalState])
            }
          />
          <RecipientsCard
            playerEmail={state.playerEmail}
            playerName={state.playerName}
            recipients={state.additionalRecipients}
            isUnder18={state.isUnder18}
            onChange={(r) => update("additionalRecipients", r)}
          />
          <EquipmentCatalogCard
            items={state.items}
            onChange={(items) => update("items", items)}
          />
          <FinancialSummaryCard
            items={state.items}
            dealDuration={state.dealDuration}
            discountPercent={state.discountPercent}
            cashIncentive={state.cashIncentive}
            cashPerYear={state.cashPerYear}
            earlyExitFee={state.earlyExitFee}
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

          {/* Action bar — explicit Save / Preview / Send buttons close to the form */}
          <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col-reverse gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {persistedId
                ? "Changes save back to the same proposal."
                : "Save to come back to this later, or send straight to the player."}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || (isSigned && !amendmentNote.trim())}
                title={
                  isSigned && !amendmentNote.trim()
                    ? "Add an amendment note to save changes"
                    : ""
                }
              >
                <Save className="mr-1.5 h-4 w-4" />
                {saveMutation.isPending
                  ? "Saving…"
                  : isSigned
                    ? "Save amendment (re-sign required)"
                    : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("Preview")}>
                <Eye className="mr-1.5 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleSend}
                disabled={
                  !state.playerEmail.trim() &&
                  !state.additionalRecipients.some(
                    (r) =>
                      (r.role ?? "").toLowerCase() === "manager" &&
                      r.email.trim().includes("@"),
                  )
                }
              >
                <Mail className="mr-1.5 h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Preview" && (
        <ProposalPreview
          playerName={state.playerName}
          dealDuration={state.dealDuration}
          items={state.items}
          discountPercent={state.discountPercent}
          cashIncentive={state.cashIncentive}
          cashPerYear={state.cashPerYear}
          earlyExitFee={state.earlyExitFee}
          clauses={state.clauses}
          aiImageRights={state.aiImageRights}
          photoProvisions={state.photoProvisions}
          selectedTerms={state.selectedTerms}
          customTerms={state.customTerms}
          notes={state.notes}
          reference={state.reference}
          preparedByName={state.preparedByName}
          preparedByEmail={state.preparedByEmail}
          preparedByRole={state.preparedByRole}
          preparedByPhone={state.preparedByPhone}
          isUnder18={state.isUnder18}
          sentAt={state.sentAt}
          signedAt={state.signedAt}
          amendments={state.amendments}
        />
      )}

      {activeTab === "Send" && (
        <SendTab
          proposalId={persistedId}
          reference={state.reference}
          status={state.status}
          publicToken={state.publicToken}
          sentAt={state.sentAt}
          signedAt={state.signedAt}
          signedName={state.signedName}
          parentSignedName={state.parentSignedName}
          signedUnder18={state.isUnder18}
          expiresAt={state.expiresAt}
          playerEmail={state.playerEmail}
          additionalRecipients={state.additionalRecipients}
          playerName={state.playerName}
          dealDuration={state.dealDuration}
          items={state.items}
          discountPercent={state.discountPercent}
          cashIncentive={state.cashIncentive}
          cashPerYear={state.cashPerYear}
          earlyExitFee={state.earlyExitFee}
          clauses={state.clauses}
          aiImageRights={state.aiImageRights}
          photoProvisions={state.photoProvisions}
          selectedTerms={state.selectedTerms}
          customTerms={state.customTerms}
          notes={state.notes}
          preparedByName={state.preparedByName}
          preparedByEmail={state.preparedByEmail}
          preparedByRole={state.preparedByRole}
          preparedByPhone={state.preparedByPhone}
          amendments={state.amendments}
        />
      )}

      <SendProposalDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        proposalId={persistedId}
        initialEmail={state.playerEmail}
        additionalRecipients={state.additionalRecipients}
      />

      <PreparedByDialog
        open={preparedByOpen}
        onOpenChange={setPreparedByOpen}
        value={{
          name: state.preparedByName,
          email: state.preparedByEmail,
          role: state.preparedByRole,
          phone: state.preparedByPhone,
        }}
        onApply={(next: PreparedBy) => {
          setPreparedByPristine(false);
          setState((s) => ({
            ...s,
            preparedByName: next.name,
            preparedByEmail: next.email,
            preparedByRole: next.role,
            preparedByPhone: next.phone,
          }));
        }}
      />
    </div>
  );
}
