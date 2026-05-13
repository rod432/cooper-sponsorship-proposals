"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface Props {
  clauses: string[];
  onChange: (clauses: string[]) => void;
}

const ClausesCard = ({ clauses, onChange }: Props) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...clauses, draft.trim()]);
    setDraft("");
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Special Clauses</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {clauses.map((c, i) => (
          <div key={i} className="flex items-start gap-2 rounded-md border bg-secondary/30 px-3 py-2">
            <p className="flex-1 text-sm text-foreground">{c}</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChange(clauses.filter((_, j) => j !== i))}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input placeholder="Add a clause…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button size="sm" onClick={add} disabled={!draft.trim()}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClausesCard;