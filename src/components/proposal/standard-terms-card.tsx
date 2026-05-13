"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export interface SelectedTerm {
  id: string;
  title: string;
  body: string;
}

interface Props {
  selectedTerms: SelectedTerm[];
  onChange: (terms: SelectedTerm[]) => void;
}

const StandardTermsCard = ({ selectedTerms, onChange }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: terms = [] } = useQuery({
    queryKey: ["standard_terms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("standard_terms").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const isSelected = (id: string) => selectedTerms.some((t) => t.id === id);

  const toggle = (term: typeof terms[0]) => {
    if (isSelected(term.id)) {
      onChange(selectedTerms.filter((t) => t.id !== term.id));
    } else {
      onChange([...selectedTerms, { id: term.id, title: term.title, body: term.body }]);
    }
  };

  const selectAll = () => onChange(terms.map((t) => ({ id: t.id, title: t.title, body: t.body })));
  const deselectAll = () => onChange([]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Standard Terms</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
          <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect All</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {terms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No standard terms configured.</p>
        ) : terms.map((term) => (
          <div key={term.id} className="rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={isSelected(term.id)} onCheckedChange={() => toggle(term)} />
              <span className="flex-1 text-sm font-medium text-foreground">{term.title}</span>
              <Collapsible open={expanded[term.id]} onOpenChange={(o) => setExpanded((s) => ({ ...s, [term.id]: o }))}>
                <CollapsibleTrigger className="text-muted-foreground hover:text-foreground">
                  <ChevronDown className={`h-4 w-4 transition-transform ${expanded[term.id] ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
              </Collapsible>
            </div>
            {expanded[term.id] && (
              <p className="mt-2 text-xs text-muted-foreground">{term.body}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default StandardTermsCard;