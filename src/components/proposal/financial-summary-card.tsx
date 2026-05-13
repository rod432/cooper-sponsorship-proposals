"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalItem } from "./equipment-catalog-card";

interface Props {
  items: ProposalItem[];
  discountPercent: number;
  cashIncentive: number;
  onChange: (field: string, value: number) => void;
}

const FinancialSummaryCard = ({ items, discountPercent, cashIncentive, onChange }: Props) => {
  const subtotal = items.reduce((sum, item) => {
    const specTotal = Object.values(item.specs).reduce((s, sp) => s + sp.price, 0);
    return sum + (item.basePrice + specTotal) * item.quantity;
  }, 0);

  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const totalValue = afterDiscount + cashIncentive;

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
        <Row label="Equipment Subtotal" value={subtotal} />
        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm">Discount %</Label>
          <Input
            type="number"
            className="h-8 w-20 font-mono text-sm"
            min={0} max={100}
            value={discountPercent}
            onChange={(e) => onChange("discountPercent", Number(e.target.value))}
          />
        </div>
        <Row label="Discount Amount" value={discountAmount} />
        <Row label="After Discount" value={afterDiscount} />
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
        <div className="border-t pt-3">
          <Row label="Total Sponsorship Value" value={totalValue} bold />
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;