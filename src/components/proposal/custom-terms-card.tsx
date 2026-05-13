"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

interface Props {
  terms: string[];
  onChange: (terms: string[]) => void;
}

const CustomTermsCard = ({ terms, onChange }: Props) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...terms, draft.trim()]);
    setDraft("");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Custom Terms</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {terms.map((t, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md border bg-secondary/30 px-3 py-2">
            <p className="flex-1 text-sm text-foreground">{t}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChange(terms.filter((_, j) => j !== i))}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Textarea placeholder="Add a custom term…" value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
        <Button size="sm" onClick={add} disabled={!draft.trim()}><Plus className="mr-1 h-4 w-4" />Add</Button>
      </CardContent>
    </Card>
  );
};

export default CustomTermsCard;