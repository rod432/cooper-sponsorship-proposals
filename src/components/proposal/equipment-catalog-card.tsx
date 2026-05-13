"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Copy, Minus, Plus } from "lucide-react";
import { useState } from "react";

export interface ProposalItem {
  id: string; // unique per line item
  productId: string;
  productName: string;
  categoryId: string;
  quantity: number;
  basePrice: number;
  specs: Record<string, { optionId: string; value: string; price: number }>;
  colour: string;
}

interface Props {
  items: ProposalItem[];
  onChange: (items: ProposalItem[]) => void;
}

const EquipmentCatalogCard = ({ items, onChange }: Props) => {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: specTypes = [] } = useQuery({
    queryKey: ["spec_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spec_types").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: specOptions = [] } = useQuery({
    queryKey: ["spec_options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("spec_options").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: colourOptions = [] } = useQuery({
    queryKey: ["colour_options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colour_options").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const getItemsForProduct = (productId: string) => items.filter((i) => i.productId === productId);

  const addItem = (product: typeof products[0]) => {
    onChange([...items, {
      id: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      categoryId: product.category_id,
      quantity: 1,
      basePrice: Number(product.default_price),
      specs: {},
      colour: "",
    }]);
  };

  const removeItem = (itemId: string) => {
    onChange(items.filter((i) => i.id !== itemId));
  };

  const duplicateItem = (itemId: string) => {
    const source = items.find((i) => i.id === itemId);
    if (!source) return;
    onChange([...items, { ...source, id: crypto.randomUUID() }]);
  };

  const setQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    onChange(items.map((i) => i.id === itemId ? { ...i, quantity: qty } : i));
  };

  const setSpec = (itemId: string, specTypeId: string, optionId: string) => {
    const option = specOptions.find((o) => o.id === optionId);
    if (!option) return;
    onChange(items.map((i) =>
      i.id === itemId
        ? { ...i, specs: { ...i.specs, [specTypeId]: { optionId, value: option.value, price: Number(option.price) } } }
        : i
    ));
  };

  const setColour = (itemId: string, colour: string) => {
    onChange(items.map((i) => i.id === itemId ? { ...i, colour } : i));
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Equipment Catalog</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories configured.</p>
        ) : categories.map((cat) => {
          const catProducts = products.filter((p) => p.category_id === cat.id);
          if (catProducts.length === 0) return null;
          return (
            <Collapsible key={cat.id} open={openCats[cat.id]} onOpenChange={(o) => setOpenCats((s) => ({ ...s, [cat.id]: o }))}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-secondary/50 px-4 py-2.5 font-heading text-sm font-semibold text-foreground hover:bg-secondary">
                {cat.name}
                <ChevronDown className={`h-4 w-4 transition-transform ${openCats[cat.id] ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 pl-2">
                {catProducts.map((product) => {
                  const productItems = getItemsForProduct(product.id);
                  return (
                    <div key={product.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{productItems.length} added</span>
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => addItem(product)}>
                            <Plus className="h-3 w-3" /> Add
                          </Button>
                        </div>
                      </div>
                      {productItems.map((item, idx) => (
                        <div key={item.id} className="space-y-2 rounded-md border border-dashed bg-secondary/20 p-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground">Unit {idx + 1}</p>
                            <div className="flex items-center gap-1">
                              <div className="flex items-center gap-1 rounded-md border bg-background px-1">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setQuantity(item.id, item.quantity - 1)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="min-w-[1.5rem] text-center font-mono text-xs">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setQuantity(item.id, item.quantity + 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" title="Duplicate" onClick={() => duplicateItem(item.id)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {cat.has_customisation && specTypes.length > 0 && (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {specTypes.map((st) => {
                                const opts = specOptions.filter((o) => o.spec_type_id === st.id);
                                if (opts.length === 0) return null;
                                return (
                                  <div key={st.id} className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">{st.label}</p>
                                    <Select
                                      value={item.specs[st.id]?.optionId ?? ""}
                                      onValueChange={(v) => setSpec(item.id, st.id, v)}
                                    >
                                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                                      <SelectContent>
                                        {opts.map((o) => (
                                          <SelectItem key={o.id} value={o.id}>
                                            {o.value}{st.has_pricing && Number(o.price) > 0 ? ` (+$${Number(o.price).toFixed(2)})` : ""}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {cat.has_colour_variants && colourOptions.length > 0 && (
                            <div>
                              <p className="mb-1 text-xs font-medium text-muted-foreground">Colour</p>
                              <Select value={item.colour} onValueChange={(v) => setColour(item.id, v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select colour…" /></SelectTrigger>
                                <SelectContent>
                                  {colourOptions.map((c) => (
                                    <SelectItem key={c.id} value={c.value}>{c.value}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EquipmentCatalogCard;