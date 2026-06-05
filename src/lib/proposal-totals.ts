import type { ProposalItem } from "@/components/proposal/equipment-catalog-card";

// A post-signature change to a proposal. Logged so the agreement keeps a record.
export type Amendment = {
  at: string;
  note: string;
  priorSignedName?: string | null;
  priorSignedAt?: string | null;
};

export type ProposalTotals = {
  subtotal: number; // equipment value for one season/year
  years: number;
  gearTotal: number; // subtotal across the whole term (refreshed each season)
  discountAmount: number; // notional, display only (perk on extra gear)
  cashTotal: number; // cash incentive over the term
  totalValue: number; // gearTotal + cashTotal
};

// Turn a "2 Years" style duration into a positive integer number of years.
export function parseYears(dealDuration: string | null | undefined): number {
  const n = parseInt(String(dealDuration ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function calcProposalTotals(
  items: ProposalItem[],
  discountPercent: number,
  cashIncentive: number,
  years: number = 1,
  cashPerYear: boolean = false,
): ProposalTotals {
  const subtotal = items.reduce((sum, item) => {
    const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
    return sum + (item.basePrice + specTotal) * item.quantity;
  }, 0);
  const y = Math.max(1, Math.floor(years || 1));
  // Gear is refreshed at the start of each season, so it counts for every year.
  const gearTotal = subtotal * y;
  // The discount is a perk on ADDITIONAL gear the player may buy; it never
  // reduces the sponsored-equipment value. Kept for display only.
  const discountAmount = subtotal * (discountPercent / 100);
  // Cash is either a one-off amount or paid each year, per the proposal.
  const cashTotal = cashPerYear ? cashIncentive * y : cashIncentive;
  const totalValue = gearTotal + cashTotal;
  return { subtotal, years: y, gearTotal, discountAmount, cashTotal, totalValue };
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_signed: "Awaiting co-signature",
  approved: "Approved",
  declined: "Declined",
  changes_requested: "Changes Requested",
  amended: "Amended, awaiting re-signature",
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  partially_signed: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  changes_requested: "bg-warning/10 text-warning",
  amended: "bg-warning/10 text-warning",
};
