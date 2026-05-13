"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const PhotoProvisionsCard = ({ checked, onChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Photo Submission & Approval</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="photo-prov" checked={checked} onCheckedChange={(v) => onChange(v === true)} />
          <Label htmlFor="photo-prov" className="text-sm">Include Photo Provisions clause</Label>
        </div>
        {checked && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
              View legal text
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground">
              The Player agrees to submit all photographs featuring Cooper Cricket branded equipment to Cooper Cricket for review and approval prior to publication on any social media platform, website, or public-facing medium. Cooper Cricket reserves the right to request modifications or withhold approval.
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotoProvisionsCard;