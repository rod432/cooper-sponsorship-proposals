import type { ProposalItem } from "@/components/proposal/equipment-catalog-card";

export type ProposalTotals = {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  totalValue: number;
};

export function calcProposalTotals(
  items: ProposalItem[],
  discountPercent: number,
  cashIncentive: number,
): ProposalTotals {
  const subtotal = items.reduce((sum, item) => {
    const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
    return sum + (item.basePrice + specTotal) * item.quantity;
  }, 0);
  // The discount is a perk on ADDITIONAL gear the player may choose to buy. It
  // does not reduce the value of the sponsored equipment, so it is not part of
  // the total sponsorship value. discountAmount/afterDiscount are retained for
  // backwards compatibility but no longer affect the total.
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal;
  const totalValue = subtotal + cashIncentive;
  return { subtotal, discountAmount, afterDiscount, totalValue };
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_signed: "Awaiting co-signature",
  approved: "Approved",
  declined: "Declined",
  changes_requested: "Changes Requested",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  partially_signed: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  changes_requested: "bg-warning/10 text-warning",
};
