"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalItem } from "./equipment-catalog-card";
import { parseYears } from "@/lib/proposal-totals";

interface Props {
  items: ProposalItem[];
  dealDuration: string;
  discountPercent: number;
  cashIncentive: number;
  cashPerYear: boolean;
  onChange: (field: string, value: number | boolean) => void;
}

const FinancialSummaryCard = ({
  items,
  dealDuration,
  discountPercent,
  cashIncentive,
  cashPerYear,
  onChange,
}: Props) => {
  const subtotal = items.reduce((sum, item) => {
    const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
    return sum + (item.basePrice + specTotal) * item.quantity;
  }, 0);

  const years = parseYears(dealDuration);
  const multiYear = years > 1;
  // Gear is refreshed each season, so it counts for every year of the term.
  const gearTotal = subtotal * years;
  const cashTotal = cashPerYear ? cashIncentive * years : cashIncentive;
  // The discount is a perk on additional gear the player may buy; it does not
  // reduce the sponsored-equipment value, so the total is gear + cash only.
  const totalValue = gearTotal + cashTotal;

  const Row = ({ label, value, bold }: { label: string; value: number; bold?: boolean }) => (
    <div className={`flex justify-between ${bold ? "font-semibold text-foreground" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="font-mono">${value.toFixed(2)}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Financial Summary</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Row
          label={multiYear ? "Sponsored Equipment Value (per season)" : "Sponsored Equipment Value"}
          value={subtotal}
        />
        {multiYear && (
          <Row label={`Equipment over ${years} seasons (refreshed each year)`} value={gearTotal} />
        )}

        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm">Extra gear discount %</Label>
          <Input
            type="number"
            className="h-8 w-20 font-mono text-sm"
            min={0} max={100}
            value={discountPercent}
            onChange={(e) => onChange("discountPercent", Number(e.target.value))}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Off any additional gear the player buys. This does NOT reduce the sponsorship total below.
        </p>

        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm">Cash Incentive $</Label>
          <Input
            type="number"
            className="h-8 w-28 font-mono text-sm"
            min={0}
            value={cashIncentive}
            onChange={(e) => onChange("cashIncentive", Number(e.target.value))}
          />
        </div>
        {cashIncentive > 0 && multiYear && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={cashPerYear}
              onChange={(e) => onChange("cashPerYear", e.target.checked)}
            />
            Pay the cash incentive each season ({years}×). Leave unticked for a one-off amount.
          </label>
        )}

        <div className="border-t pt-3">
          <Row label="Total Sponsorship Value" value={totalValue} bold />
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;
