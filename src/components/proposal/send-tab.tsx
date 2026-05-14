"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Mail, ShieldCheck } from "lucide-react";
import ProposalPreview from "./proposal-preview";
import SendProposalDialog from "./send-proposal-dialog";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/proposal-totals";
import type { ProposalItem } from "./equipment-catalog-card";
import type { SelectedTerm } from "./standard-terms-card";
import { type AdditionalRecipient, ROLE_LABELS } from "./recipients-card";

interface Props {
  // Identifiers / state
  proposalId: string | null;
  reference: string;
  status: string;
  publicToken: string | null;
  sentAt: string | null;
  signedAt: string | null;
  signedName: string | null;
  parentSignedName: string | null;
  signedUnder18: boolean;

  // Recipients
  playerEmail: string;
  additionalRecipients: AdditionalRecipient[];

  // Full proposal data (for the preview)
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
  preparedByName: string;
  preparedByEmail: string;
  preparedByRole: string;
  preparedByPhone: string;
}

export default function SendTab(props: Props) {
  const { toast } = useToast();
  const [sendOpen, setSendOpen] = useState(false);

  const isApproved = props.status === "approved";
  const isDeclined = props.status === "declined";
  const hasBeenSent = !!props.sentAt;
  const canSend = !!props.proposalId && !!props.playerEmail.trim();

  const publicUrl =
    props.publicToken && typeof window !== "undefined"
      ? `${window.location.origin}/p/${props.publicToken}`
      : props.publicToken
        ? `/p/${props.publicToken}`
        : "";

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn't copy", description: "Select the link manually." });
    }
  };

  // Primary action label changes with state.
  const primaryLabel = isApproved
    ? "Resend signed agreement"
    : isDeclined
      ? "Send a revised proposal"
      : hasBeenSent
        ? "Resend proposal"
        : "Send proposal to player";

  return (
    <div className="space-y-4">
      {/* Send card */}
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">
                {isApproved
                  ? "Sponsorship agreement signed"
                  : isDeclined
                    ? "Proposal declined"
                    : hasBeenSent
                      ? "Proposal sent"
                      : "Ready to send"}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isApproved
                  ? `Signed${props.signedName ? ` by ${props.signedName}` : ""}${
                      props.signedAt
                        ? ` on ${new Date(props.signedAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}`
                        : ""
                    }.`
                  : isDeclined
                    ? "Make adjustments and send a new version when you're ready."
                    : hasBeenSent
                      ? `Sent on ${new Date(props.sentAt!).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}. The player can review, request changes, or sign at the link below.`
                      : "Save the proposal, then send the link to the player. They'll review it online and sign electronically — no PDF goes out until they agree."}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                STATUS_BADGE_CLASSES[props.status] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_LABELS[props.status] ?? props.status}
            </span>
          </div>

          {/* Recipients and link */}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sending to
              </p>
              {props.playerEmail.trim() ? (
                <ul className="mt-0.5 space-y-0.5 text-foreground">
                  <li>
                    <span className="text-xs text-primary">Player:</span>{" "}
                    {props.playerEmail}
                  </li>
                  {props.additionalRecipients
                    .filter((r) => r.email.trim().includes("@"))
                    .map((r, i) => (
                      <li key={i}>
                        <span className="text-xs text-primary">
                          {ROLE_LABELS[r.role]}:
                        </span>{" "}
                        {r.name ? `${r.name} · ` : ""}
                        <span className="text-muted-foreground">{r.email}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="mt-0.5 text-destructive">
                  No email on file — add one in Edit
                </p>
              )}
            </div>
            {props.reference && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Reference
                </p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {props.reference}
                </p>
              </div>
            )}
          </div>

          {publicUrl && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Player link
              </p>
              <div className="mt-1 flex gap-2">
                <code className="flex-1 truncate rounded-md border bg-secondary/30 px-3 py-2 font-mono text-xs">
                  {publicUrl}
                </code>
                <Button variant="outline" size="sm" onClick={copyLink} title="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button asChild variant="outline" size="sm" title="Open">
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Signed signature(s) summary */}
          {isApproved && props.signedName && (
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Electronically signed by {props.signedName}
                  {props.signedUnder18 && props.parentSignedName
                    ? ` (co-signed by parent/guardian ${props.parentSignedName})`
                    : ""}
                </p>
                {props.signedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(props.signedAt).toLocaleString("en-AU")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="lg"
              onClick={() => setSendOpen(true)}
              disabled={!canSend}
              title={canSend ? "" : "Save the proposal and add a player email first"}
            >
              <Mail className="mr-2 h-4 w-4" />
              {primaryLabel}
            </Button>
            {!props.proposalId && (
              <p className="self-center text-xs text-muted-foreground">
                Save the proposal first.
              </p>
            )}
            {props.proposalId && !props.playerEmail.trim() && (
              <p className="self-center text-xs text-destructive">
                Add a player email on the Edit tab before sending.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live preview underneath */}
      <ProposalPreview
        playerName={props.playerName}
        dealDuration={props.dealDuration}
        items={props.items}
        discountPercent={props.discountPercent}
        cashIncentive={props.cashIncentive}
        clauses={props.clauses}
        aiImageRights={props.aiImageRights}
        photoProvisions={props.photoProvisions}
        selectedTerms={props.selectedTerms}
        customTerms={props.customTerms}
        notes={props.notes}
        reference={props.reference}
        preparedByName={props.preparedByName}
        preparedByEmail={props.preparedByEmail}
        preparedByRole={props.preparedByRole}
        preparedByPhone={props.preparedByPhone}
        isUnder18={props.signedUnder18}
        sentAt={props.sentAt}
        signedAt={props.signedAt}
      />

      <SendProposalDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        proposalId={props.proposalId}
        initialEmail={props.playerEmail}
        additionalRecipients={props.additionalRecipients}
      />
    </div>
  );
}
