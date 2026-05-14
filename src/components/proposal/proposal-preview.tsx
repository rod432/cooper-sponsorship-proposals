import Image from "next/image";
import type { ProposalItem } from "./equipment-catalog-card";
import type { SelectedTerm } from "./standard-terms-card";
import { COMPANY, addressLines } from "@/lib/company-info";

interface ProposalPreviewProps {
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
  // Optional metadata for sent / signed proposals.
  reference?: string;
  preparedByName?: string;
  preparedByEmail?: string;
  preparedByRole?: string;
  preparedByPhone?: string;
  isUnder18?: boolean;
  sentAt?: string | null;
  signedAt?: string | null;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });

const ProposalPreview = (props: ProposalPreviewProps) => {
  const {
    playerName,
    dealDuration,
    items,
    discountPercent,
    cashIncentive,
    clauses,
    aiImageRights,
    photoProvisions,
    selectedTerms,
    customTerms,
    notes,
    reference,
    preparedByName,
    preparedByEmail,
    preparedByRole,
    preparedByPhone,
    isUnder18,
    sentAt,
    signedAt,
  } = props;

  const subtotal = items.reduce((sum, item) => {
    const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
    return sum + (item.basePrice + specTotal) * item.quantity;
  }, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const totalValue = afterDiscount + cashIncentive;

  // Group items by category for nicer presentation.
  const grouped = items.reduce<Record<string, ProposalItem[]>>((acc, item) => {
    const key = item.categoryId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const dateLabel = signedAt
    ? `Signed ${fmtDate(new Date(signedAt))}`
    : sentAt
      ? `Sent ${fmtDate(new Date(sentAt))}`
      : `Prepared ${fmtDate(new Date())}`;

  return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-lg border bg-card shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      {/* Letterhead band — Cooper blue */}
      <header className="bg-gradient-to-r from-primary-dark to-primary px-8 py-6 text-primary-foreground print:bg-primary">
        <div className="flex items-start justify-between gap-6">
          <Image
            src="/cooper-cricket-wordmark-white.svg"
            alt="Cooper Cricket"
            width={220}
            height={66}
            className="h-14 w-auto"
            priority
          />
          <div className="text-right text-xs leading-relaxed">
            <p className="font-heading text-base font-bold uppercase tracking-wider">
              Sponsorship Proposal
            </p>
            {reference && (
              <p className="mt-1 font-mono text-[11px] opacity-90">{reference}</p>
            )}
            <p className="mt-1 opacity-90">{dateLabel}</p>
          </div>
        </div>
      </header>

      {/* Sub-header strip with business contact details */}
      <div className="border-b bg-secondary/40 px-8 py-3 text-[11px] leading-relaxed text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <p>
            <strong className="text-foreground">{COMPANY.legalName}</strong> · ABN {COMPANY.abn}
          </p>
          <p>
            {addressLines().join(", ")} · {COMPANY.phone} · {COMPANY.email}
          </p>
        </div>
      </div>

      <div className="space-y-8 px-8 py-8">
        {/* Prepared for / Prepared by */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
              Prepared for
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-foreground">
              {playerName || "—"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isUnder18 ? "Youth player (under 18)" : "Adult player"} ·{" "}
              {dealDuration || "—"} sponsorship term
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
              Prepared by
            </p>
            <p className="mt-1 font-heading text-lg font-semibold text-foreground">
              {preparedByName || COMPANY.tradingName}
            </p>
            {preparedByRole && (
              <p className="text-sm text-foreground">{preparedByRole}</p>
            )}
            {preparedByEmail && (
              <p className="mt-0.5 text-sm text-muted-foreground">{preparedByEmail}</p>
            )}
            {preparedByPhone && (
              <p className="text-sm text-muted-foreground">{preparedByPhone}</p>
            )}
          </div>
        </div>

        {/* Equipment */}
        {items.length > 0 && (
          <Section title="Equipment Package">
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/40 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Item</th>
                    <th className="w-16 px-3 py-2 text-center">Qty</th>
                    <th className="w-32 px-3 py-2 text-right">Unit Price</th>
                    <th className="w-32 px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(grouped).map(([catId, catItems]) =>
                    catItems.map((item, i) => {
                      const specTotal = Object.values(item.specs).reduce(
                        (s, sp) => s + sp.price,
                        0,
                      );
                      const unitPrice = item.basePrice + specTotal;
                      const specDetails = Object.values(item.specs)
                        .map((s) => s.value)
                        .filter(Boolean);
                      return (
                        <tr key={`${catId}-${item.id ?? i}`} className="even:bg-secondary/20">
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-foreground">
                              {item.productName}
                            </span>
                            {(specDetails.length > 0 || item.colour) && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {[...specDetails, item.colour].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-sm">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm">
                            {fmtMoney(unitPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-sm font-medium">
                            {fmtMoney(unitPrice * item.quantity)}
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Financial Summary */}
        <Section title="Financial Summary">
          <div className="rounded-lg border bg-secondary/20 px-4 py-3">
            <FinRow label="Equipment subtotal" value={fmtMoney(subtotal)} />
            {discountPercent > 0 && (
              <>
                <FinRow
                  label={`Discount (${discountPercent}%)`}
                  value={`-${fmtMoney(discountAmount)}`}
                />
                <FinRow label="After discount" value={fmtMoney(afterDiscount)} />
              </>
            )}
            {cashIncentive > 0 && (
              <FinRow label="Cash incentive" value={fmtMoney(cashIncentive)} />
            )}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-heading text-sm font-semibold uppercase tracking-wider">
              Total Sponsorship Value
            </span>
            <span className="font-mono text-lg font-bold">{fmtMoney(totalValue)}</span>
          </div>
        </Section>

        {/* Special Clauses */}
        {clauses.length > 0 && (
          <Section title="Special Clauses">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
              {clauses.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* AI Image Rights */}
        {aiImageRights && (
          <Section title="AI Image Rights">
            <p className="text-sm leading-relaxed text-foreground">
              The Player grants Cooper Cricket the right to use their likeness, image,
              and related content for AI-generated marketing materials, including but
              not limited to digital advertisements, social media content, and
              promotional imagery, for the duration of the sponsorship agreement.
            </p>
          </Section>
        )}

        {/* Photo Provisions */}
        {photoProvisions && (
          <Section title="Photo Submission & Approval">
            <p className="text-sm leading-relaxed text-foreground">
              The Player agrees to participate in photo sessions as reasonably
              requested by Cooper Cricket. All promotional images will be submitted to
              the Player for approval prior to public use.
            </p>
          </Section>
        )}

        {/* Standard Terms */}
        {selectedTerms.length > 0 && (
          <Section title="Standard Terms & Conditions">
            <ol className="space-y-3">
              {selectedTerms.map((term, i) => (
                <li key={term.id}>
                  <h4 className="text-sm font-semibold text-foreground">
                    <span className="text-primary">{i + 1}.</span> {term.title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {term.body}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Custom Terms */}
        {customTerms.length > 0 && (
          <Section title="Additional Terms">
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
              {customTerms.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Notes */}
        {notes && (
          <Section title="Additional Notes">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {notes}
            </p>
          </Section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-secondary/30 px-8 py-4 text-center text-[11px] leading-relaxed text-muted-foreground">
        <p>
          {COMPANY.legalName} · ABN {COMPANY.abn} · {COMPANY.phone} ·{" "}
          {COMPANY.email}
        </p>
        <p className="mt-1">
          This proposal is valid for {COMPANY.proposalValidityDays} days from the date
          of issue.
        </p>
      </footer>
    </article>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section>
    <h3 className="mb-3 border-b border-primary/20 pb-1.5 font-heading text-base font-bold uppercase tracking-wider text-primary">
      {title}
    </h3>
    {children}
  </section>
);

const FinRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-1 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);

export default ProposalPreview;
