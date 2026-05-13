"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import ProposalPreview from "./proposal-preview";
import type { ProposalItem } from "./equipment-catalog-card";
import type { SelectedTerm } from "./standard-terms-card";

interface Props {
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

const ProposalPrintView = (props: Props) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          Click "Print / Save PDF" to open your browser's print dialog. Select "Save as PDF" as the destination.
        </p>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>
      <ProposalPreview {...props} />
    </div>
  );
};

export default ProposalPrintView;