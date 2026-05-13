"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { TablesUpdate } from "@/lib/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, EyeOff, Pencil, Trash2, X, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  sort_order: number;
  has_customisation: boolean;
  has_colour_variants: boolean;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
  default_price: number;
  sort_order: number;
  is_active: boolean;
  categories: { name: string; sort_order: number } | null;
}

interface Props {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
}

const ProductsSection = ({ categories, products, isLoading }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const catProducts = products.filter((p) => p.category_id === newCategoryId);
      const maxSort = catProducts.length > 0 ? Math.max(...catProducts.map((p) => p.sort_order)) : 0;
      const { error } = await supabase.from("products").insert({
        name: newName.trim(),
        category_id: newCategoryId,
        default_price: parseFloat(newPrice) || 0,
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setNewName("");
      setNewCategoryId("");
      setNewPrice("");
      toast({ title: "Product added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"products"> }) => {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ title: "Product deleted" });
    },
  });

  const sortedProducts = [...products].sort((a, b) => {
    const aSortCat = a.categories?.sort_order ?? 0;
    const bSortCat = b.categories?.sort_order ?? 0;
    if (aSortCat !== bSortCat) return aSortCat - bSortCat;
    return a.sort_order - b.sort_order;
  });

  const filtered = filter === "all" ? sortedProducts : sortedProducts.filter((p) => p.category_id === filter);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditCategoryId(p.category_id);
    setEditPrice(String(p.default_price));
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateMutation.mutate({
        id: editingId,
        updates: { name: editName.trim(), category_id: editCategoryId, default_price: parseFloat(editPrice) || 0 },
      });
      toast({ title: "Product updated" });
    }
  };

  const toggleActive = (p: Product) => {
    updateMutation.mutate({ id: p.id, updates: { is_active: !p.is_active } });
    toast({ title: p.is_active ? "Product deactivated" : "Product activated" });
  };

  const formatPrice = (price: number) => `$${price.toLocaleString("en-AU", { minimumFractionDigits: 0 })}`;

  const getCountForCategory = (catId: string) => products.filter((p) => p.category_id === catId).length;

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-heading text-lg">Products</CardTitle>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "outline" : "default"}>
          {showAdd ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showAdd ? "Cancel" : "Add Product"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {cat.name} ({getCountForCategory(cat.id)})
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-accent/50 p-3">
            <Input placeholder="Product name" value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-[180px]" />
            <Select value={newCategoryId} onValueChange={setNewCategoryId}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Price" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="max-w-[100px]" />
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!newName.trim() || !newCategoryId || addMutation.isPending}>
              Save
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No products yet. Add your first product above.</p>
        ) : (
          filtered.map((product) => (
            <div
              key={product.id}
              className={`flex items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/30 ${!product.is_active ? "opacity-50" : ""}`}
            >
              {editingId === product.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-[180px]" autoFocus />
                  <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="max-w-[90px]" />
                  <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</span>
                  <Badge variant="secondary" className="text-xs">{product.categories?.name}</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleActive(product)}>
                    {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(product)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(product)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this product.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProductsSection;