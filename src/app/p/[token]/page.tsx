import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProposalPreview from "@/components/proposal/proposal-preview";
import type { ProposalItem } from "@/components/proposal/equipment-catalog-card";
import type { SelectedTerm } from "@/components/proposal/standard-terms-card";
import ResponseForm from "./response-form";
import SignedFooter from "./signed-footer";
import PrintLock from "./print-lock";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/proposal-totals";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*, proposal_responses(id, response_type, message, responded_at)")
    .eq("public_token", token)
    .single();

  if (error || !proposal) notFound();

  const items = (proposal.items as unknown as ProposalItem[]) ?? [];
  const selectedTerms = (proposal.terms as unknown as SelectedTerm[]) ?? [];
  const clauses = (proposal.clauses as unknown as string[]) ?? [];

  const responses = proposal.proposal_responses ?? [];
  const isApproved = proposal.status === "approved";
  const isDeclined = proposal.status === "declined";
  const finalised = isApproved || isDeclined;

  return (
    <div className="space-y-6">
      {!isApproved && <PrintLock />}

      <div className="rounded-lg border bg-card p-4 shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sponsorship proposal for
            </p>
            <h1 className="font-heading text-xl font-bold text-foreground">
              {proposal.player_name || "—"}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              STATUS_BADGE_CLASSES[proposal.status] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {STATUS_LABELS[proposal.status] ?? proposal.status}
          </span>
        </div>
      </div>

      <ProposalPreview
        playerName={proposal.player_name}
        dealDuration={proposal.deal_duration}
        items={items}
        discountPercent={Number(proposal.discount_percent)}
        cashIncentive={Number(proposal.cash_incentive)}
        clauses={clauses}
        aiImageRights={proposal.ai_image_rights}
        photoProvisions={proposal.photo_provisions}
        selectedTerms={selectedTerms}
        customTerms={[]}
        notes={proposal.notes}
        reference={proposal.reference}
        preparedByName={proposal.prepared_by_name}
        preparedByEmail={proposal.prepared_by_email}
        preparedByRole={proposal.prepared_by_role}
        preparedByPhone={proposal.prepared_by_phone}
        isUnder18={proposal.signed_under_18}
        sentAt={proposal.sent_at}
        signedAt={proposal.signed_at}
      />

      {isApproved && (
        <SignedFooter
          signedName={proposal.signed_name ?? ""}
          parentSignedName={proposal.parent_signed_name}
          signedUnder18={proposal.signed_under_18}
          signedAt={proposal.signed_at}
          expiresAt={proposal.expires_at}
        />
      )}

      {proposal.status === "partially_signed" && (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm print:hidden">
          <p className="font-heading font-semibold text-foreground">
            {proposal.player_signed_at
              ? "Player signed — awaiting parent/guardian signature"
              : "Parent/guardian signed — awaiting player signature"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This agreement is only finalised once both have signed. Whoever is
            left can sign below using this same link.
          </p>
        </div>
      )}

      {!finalised && (
        <ResponseForm
          token={token}
          defaultPlayerName={proposal.player_name}
          isUnder18={proposal.signed_under_18}
          playerSigned={!!proposal.player_signed_at}
          parentSigned={!!proposal.parent_signed_at}
        />
      )}

      {isDeclined && (
        <div className="rounded-lg border bg-card p-6 text-center print:hidden">
          <p className="font-heading text-lg font-semibold text-foreground">
            This proposal has been declined.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Need to talk it through? Contact Cooper Cricket directly.
          </p>
        </div>
      )}

      {responses.length > 0 && (
        <div className="rounded-lg border bg-card p-4 print:hidden">
          <h3 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Response history
          </h3>
          <ul className="space-y-3">
            {responses
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime(),
              )
              .map((r) => (
                <li key={r.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">
                    {r.response_type === "approve"
                      ? "Approved"
                      : r.response_type === "decline"
                        ? "Declined"
                        : "Changes requested"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.responded_at).toLocaleString("en-AU")}
                  </p>
                  {r.message && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {r.message}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
