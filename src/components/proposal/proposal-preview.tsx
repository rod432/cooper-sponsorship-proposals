import Image from "next/image";
import type { ProposalItem } from "./equipment-catalog-card";
import type { SelectedTerm } from "./standard-terms-card";

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
}

const ProposalPreview = (props: ProposalPreviewProps) => {
  const {
    playerName, dealDuration, items, discountPercent, cashIncentive,
    clauses, aiImageRights, photoProvisions, selectedTerms, customTerms, notes,
  } = props;

  const subtotal = items.reduce((sum, item) => {
    const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
    return sum + (item.basePrice + specTotal) * item.quantity;
  }, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const totalValue = afterDiscount + cashIncentive;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  // Group items by category
  const grouped = items.reduce<Record<string, ProposalItem[]>>((acc, item) => {
    const key = item.categoryId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-lg border bg-card p-8 shadow-sm print:max-w-none print:border-0 print:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Sponsorship Proposal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cooper Cricket Pty Ltd</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 p-2">
          <Image src="/cooper-c-logo.png" alt="Cooper Cricket" width={48} height={48} className="h-full w-full object-contain" />
        </div>
      </div>

      {/* Player Details */}
      <Section title="Player Details">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Player Name" value={playerName || "—"} />
          <Field label="Deal Duration" value={dealDuration || "—"} />
        </div>
      </Section>

      {/* Equipment */}
      {items.length > 0 && (
        <Section title="Equipment Package">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(grouped).map(([, catItems]) =>
                catItems.map((item) => {
                  const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
                  const unitPrice = item.basePrice + specTotal;
                  const specDetails = Object.values(item.specs).map((s) => s.value).filter(Boolean);
                  return (
                    <tr key={item.productId}>
                      <td className="py-2">
                        <span className="font-medium text-foreground">{item.productName}</span>
                        {(specDetails.length > 0 || item.colour) && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({[...specDetails, item.colour].filter(Boolean).join(", ")})
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center font-mono">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">{fmt(unitPrice)}</td>
                      <td className="py-2 text-right font-mono">{fmt(unitPrice * item.quantity)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Section>
      )}

      {/* Financial Summary */}
      <Section title="Financial Summary">
        <div className="space-y-2">
          <FinRow label="Equipment Subtotal" value={fmt(subtotal)} />
          {discountPercent > 0 && (
            <>
              <FinRow label={`Discount (${discountPercent}%)`} value={`-${fmt(discountAmount)}`} />
              <FinRow label="After Discount" value={fmt(afterDiscount)} />
            </>
          )}
          {cashIncentive > 0 && <FinRow label="Cash Incentive" value={fmt(cashIncentive)} />}
          <div className="border-t pt-2">
            <div className="flex justify-between font-heading text-base font-bold text-foreground">
              <span>Total Sponsorship Value</span>
              <span className="font-mono">{fmt(totalValue)}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Special Clauses */}
      {clauses.length > 0 && (
        <Section title="Special Clauses">
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {clauses.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Section>
      )}

      {/* AI Image Rights */}
      {aiImageRights && (
        <Section title="AI Image Rights">
          <p className="text-sm text-foreground">
            The Player grants Cooper Cricket the right to use their likeness, image, and related content for AI-generated marketing materials, including but not limited to digital advertisements, social media content, and promotional imagery, for the duration of the sponsorship agreement.
          </p>
        </Section>
      )}

      {/* Photo Provisions */}
      {photoProvisions && (
        <Section title="Photo Submission & Approval">
          <p className="text-sm text-foreground">
            The Player agrees to participate in photo sessions as reasonably requested by Cooper Cricket. All promotional images will be submitted to the Player for approval prior to public use.
          </p>
        </Section>
      )}

      {/* Standard Terms */}
      {selectedTerms.length > 0 && (
        <Section title="Standard Terms & Conditions">
          <div className="space-y-4">
            {selectedTerms.map((term, i) => (
              <div key={term.id}>
                <h4 className="text-sm font-semibold text-foreground">{i + 1}. {term.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{term.body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Custom Terms */}
      {customTerms.length > 0 && (
        <Section title="Additional Terms">
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {customTerms.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </Section>
      )}

      {/* Notes */}
      {notes && (
        <Section title="Additional Notes">
          <p className="whitespace-pre-wrap text-sm text-foreground">{notes}</p>
        </Section>
      )}

      {/* Footer */}
      <div className="border-t pt-6 text-center text-xs text-muted-foreground">
        <p>Cooper Cricket Pty Ltd · ABN XX XXX XXX XXX</p>
        <p className="mt-1">This proposal is valid for 30 days from the date of issue.</p>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="mb-3 font-heading text-base font-semibold text-foreground">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
  </div>
);

const FinRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);

export default ProposalPreview;
