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

const AIImageRightsCard = ({ checked, onChange }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">AI Image Rights</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="ai-rights" checked={checked} onCheckedChange={(v) => onChange(v === true)} />
          <Label htmlFor="ai-rights" className="text-sm">Include AI Image Rights clause</Label>
        </div>
        {checked && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
              View legal text
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border bg-secondary/30 p-3 text-xs text-muted-foreground">
              The Player grants Cooper Cricket the right to use their likeness, image, and related content for AI-generated marketing materials, including but not limited to digital advertisements, social media content, and promotional imagery, for the duration of the sponsorship agreement.
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};

export default AIImageRightsCard;