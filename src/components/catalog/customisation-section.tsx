"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TablesUpdate } from "@/lib/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from "lucide-react";

const CustomisationSection = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ─── Spec Types ────────────────────────────────
  const { data: specTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["specTypes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spec_types").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: specOptions = [] } = useQuery({
    queryKey: ["specOptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spec_options").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: colourOptions = [], isLoading: loadingColours } = useQuery({
    queryKey: ["colourOptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colour_options").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["specTypes"] });
    queryClient.invalidateQueries({ queryKey: ["specOptions"] });
    queryClient.invalidateQueries({ queryKey: ["colourOptions"] });
  };

  // ─── Add Spec Type ─────────────────────────────
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeKey, setNewTypeKey] = useState("");
  const [newTypePricing, setNewTypePricing] = useState(false);

  const slugify = (s: string) => s.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_").replace(/^_|_$/g, "").replace(/([a-z])([A-Z])/g, "$1_$2").split("_").map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");

  const addTypeMutation = useMutation({
    mutationFn: async () => {
      const maxSort = specTypes.length > 0 ? Math.max(...specTypes.map((t) => t.sort_order)) : 0;
      const { error } = await supabase.from("spec_types").insert({
        label: newTypeLabel.trim(),
        key: newTypeKey.trim() || slugify(newTypeLabel),
        has_pricing: newTypePricing,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setShowAddType(false);
      setNewTypeLabel("");
      setNewTypeKey("");
      setNewTypePricing(false);
      toast({ title: "Spec type added" });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"spec_types"> }) => {
      const { error } = await supabase.from("spec_types").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  const reorderType = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= specTypes.length) return;
    const a = specTypes[index];
    const b = specTypes[swapIndex];
    await supabase.from("spec_types").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("spec_types").update({ sort_order: a.sort_order }).eq("id", b.id);
    invalidateAll();
    toast({ title: "Spec types reordered" });
  };

  // ─── Spec Options ──────────────────────────────
  const [newOptionValue, setNewOptionValue] = useState<Record<string, string>>({});
  const [newOptionPrice, setNewOptionPrice] = useState<Record<string, string>>({});

  const addOptionMutation = useMutation({
    mutationFn: async ({ specTypeId, value, price }: { specTypeId: string; value: string; price: number }) => {
      const typeOptions = specOptions.filter((o) => o.spec_type_id === specTypeId);
      const maxSort = typeOptions.length > 0 ? Math.max(...typeOptions.map((o) => o.sort_order)) : 0;
      const { error } = await supabase.from("spec_options").insert({
        spec_type_id: specTypeId,
        value: value.trim(),
        price,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      invalidateAll();
      setNewOptionValue((prev) => ({ ...prev, [vars.specTypeId]: "" }));
      setNewOptionPrice((prev) => ({ ...prev, [vars.specTypeId]: "" }));
      toast({ title: "Option added" });
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"spec_options"> }) => {
      const { error } = await supabase.from("spec_options").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spec_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Option deleted" });
    },
  });

  // ─── Colour Options ───────────────────────────
  const [newColour, setNewColour] = useState("");
  const [editColourId, setEditColourId] = useState<string | null>(null);
  const [editColourValue, setEditColourValue] = useState("");

  const addColourMutation = useMutation({
    mutationFn: async () => {
      const maxSort = colourOptions.length > 0 ? Math.max(...colourOptions.map((c) => c.sort_order)) : 0;
      const { error } = await supabase.from("colour_options").insert({
        value: newColour.trim(),
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setNewColour("");
      toast({ title: "Colour added" });
    },
  });

  const updateColourMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"colour_options"> }) => {
      const { error } = await supabase.from("colour_options").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setEditColourId(null);
    },
  });

  const deleteColourMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colour_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Colour deleted" });
    },
  });

  const reorderColour = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= colourOptions.length) return;
    const a = colourOptions[index];
    const b = colourOptions[swapIndex];
    await supabase.from("colour_options").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("colour_options").update({ sort_order: a.sort_order }).eq("id", b.id);
    invalidateAll();
    toast({ title: "Colours reordered" });
  };

  const getOptionsForType = (typeId: string) => specOptions.filter((o) => o.spec_type_id === typeId);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg">Customisation Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Spec Types */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Spec Types</h3>
            <Button size="sm" onClick={() => setShowAddType(!showAddType)} variant={showAddType ? "outline" : "default"}>
              {showAddType ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
              {showAddType ? "Cancel" : "Add Spec Type"}
            </Button>
          </div>

          {showAddType && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-accent/50 p-3">
              <Input
                placeholder="Label"
                value={newTypeLabel}
                onChange={(e) => {
                  setNewTypeLabel(e.target.value);
                  if (!newTypeKey || newTypeKey === slugify(newTypeLabel)) {
                    setNewTypeKey(slugify(e.target.value));
                  }
                }}
                className="max-w-[150px]"
              />
              <Input placeholder="Key" value={newTypeKey} onChange={(e) => setNewTypeKey(e.target.value)} className="max-w-[150px] font-mono text-sm" />
              <div className="flex items-center gap-1.5 text-sm">
                <Switch checked={newTypePricing} onCheckedChange={setNewTypePricing} />
                <span className="text-muted-foreground">Priced</span>
              </div>
              <Button size="sm" onClick={() => addTypeMutation.mutate()} disabled={!newTypeLabel.trim() || addTypeMutation.isPending}>Save</Button>
            </div>
          )}

          {loadingTypes ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : specTypes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No spec types yet.</p>
          ) : (
            <Accordion type="multiple" className="space-y-1">
              {specTypes.map((type, index) => (
                <AccordionItem key={type.id} value={type.id} className="rounded-lg border border-border">
                  <div className="flex items-center gap-2 px-3 py-1">
                    <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{type.label}</span>
                        {type.has_pricing && <Badge variant="secondary" className="text-xs">Priced</Badge>}
                        <Badge variant="outline" className="text-xs">{getOptionsForType(type.id).length} options</Badge>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-0.5">
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={(checked) => {
                          updateTypeMutation.mutate({ id: type.id, updates: { is_active: checked } });
                          toast({ title: checked ? "Spec type activated" : "Spec type deactivated" });
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => reorderType(index, "up")}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === specTypes.length - 1} onClick={() => reorderType(index, "down")}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="px-3 pb-3">
                    <div className="space-y-1.5 rounded-lg bg-accent/30 p-2">
                      {getOptionsForType(type.id).map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1">{opt.value}</span>
                          {type.has_pricing && (
                            <Input
                              type="number"
                              value={opt.price}
                              onChange={(e) => updateOptionMutation.mutate({ id: opt.id, updates: { price: parseFloat(e.target.value) || 0 } })}
                              className="h-7 w-[90px] font-mono text-xs"
                            />
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteOptionMutation.mutate(opt.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {/* Add option */}
                      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                        <Input
                          placeholder="New option"
                          value={newOptionValue[type.id] || ""}
                          onChange={(e) => setNewOptionValue((prev) => ({ ...prev, [type.id]: e.target.value }))}
                          className="h-7 flex-1 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && (newOptionValue[type.id] || "").trim()) {
                              addOptionMutation.mutate({
                                specTypeId: type.id,
                                value: newOptionValue[type.id],
                                price: parseFloat(newOptionPrice[type.id] || "0") || 0,
                              });
                            }
                          }}
                        />
                        {type.has_pricing && (
                          <Input
                            placeholder="$"
                            type="number"
                            value={newOptionPrice[type.id] || ""}
                            onChange={(e) => setNewOptionPrice((prev) => ({ ...prev, [type.id]: e.target.value }))}
                            className="h-7 w-[80px] font-mono text-xs"
                          />
                        )}
                        <Button
                          size="sm"
                          className="h-7"
                          disabled={!(newOptionValue[type.id] || "").trim()}
                          onClick={() => addOptionMutation.mutate({
                            specTypeId: type.id,
                            value: newOptionValue[type.id],
                            price: parseFloat(newOptionPrice[type.id] || "0") || 0,
                          })}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Colour Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Colour Options (for colour variant categories)</h3>

          <div className="flex items-center gap-2">
            <Input
              placeholder="New colour"
              value={newColour}
              onChange={(e) => setNewColour(e.target.value)}
              className="max-w-[200px]"
              onKeyDown={(e) => e.key === "Enter" && newColour.trim() && addColourMutation.mutate()}
            />
            <Button size="sm" onClick={() => addColourMutation.mutate()} disabled={!newColour.trim() || addColourMutation.isPending}>
              Add
            </Button>
          </div>

          {loadingColours ? (
            <div className="space-y-1">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : colourOptions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No colours yet.</p>
          ) : (
            <div className="space-y-1">
              {colourOptions.map((colour, index) => (
                <div key={colour.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm">
                  {editColourId === colour.id ? (
                    <>
                      <Input value={editColourValue} onChange={(e) => setEditColourValue(e.target.value)} className="max-w-[200px]" autoFocus onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateColourMutation.mutate({ id: colour.id, updates: { value: editColourValue.trim() } });
                          toast({ title: "Colour updated" });
                        }
                      }} />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        updateColourMutation.mutate({ id: colour.id, updates: { value: editColourValue.trim() } });
                        toast({ title: "Colour updated" });
                      }}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditColourId(null)}><X className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1">{colour.value}</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => reorderColour(index, "up")}>
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === colourOptions.length - 1} onClick={() => reorderColour(index, "down")}>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditColourId(colour.id); setEditColourValue(colour.value); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteColourMutation.mutate(colour.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomisationSection;