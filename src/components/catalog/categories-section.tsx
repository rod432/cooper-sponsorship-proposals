"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  sort_order: number;
  has_customisation: boolean;
  has_colour_variants: boolean;
  created_at: string;
}

interface Product {
  id: string;
  category_id: string;
}

interface Props {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
}

const CategoriesSection = ({ categories, products, isLoading }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCustomisation, setNewCustomisation] = useState(false);
  const [newColourVariants, setNewColourVariants] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxSort = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) : 0;
      const { error } = await supabase.from("categories").insert({
        name: newName.trim(),
        sort_order: maxSort + 1,
        has_customisation: newCustomisation,
        has_colour_variants: newColourVariants,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setShowAdd(false);
      setNewName("");
      setNewCustomisation(false);
      setNewColourVariants(false);
      toast({ title: "Category added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const { error } = await supabase.from("categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast({ title: "Category deleted" });
    },
  });

  const reorder = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= categories.length) return;
    const a = categories[index];
    const b = categories[swapIndex];
    await supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id);
    invalidate();
    toast({ title: "Categories reordered" });
  };

  const getProductCount = (categoryId: string) =>
    products.filter((p) => p.category_id === categoryId).length;

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateMutation.mutate({ id: editingId, updates: { name: editName.trim() } });
      toast({ title: "Category updated" });
    }
  };

  const toggleFlag = (cat: Category, flag: "has_customisation" | "has_colour_variants") => {
    updateMutation.mutate({ id: cat.id, updates: { [flag]: !cat[flag] } });
    toast({ title: `${flag === "has_customisation" ? "Customisation" : "Colour Variants"} ${!cat[flag] ? "enabled" : "disabled"}` });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="font-heading text-lg">Categories</CardTitle>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "outline" : "default"}>
          {showAdd ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {showAdd ? "Cancel" : "Add Category"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-accent/50 p-3">
            <Input
              placeholder="Category name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="max-w-[200px]"
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && addMutation.mutate()}
            />
            <div className="flex items-center gap-1.5 text-sm">
              <Switch checked={newCustomisation} onCheckedChange={setNewCustomisation} />
              <span className="text-muted-foreground">Customisation</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Switch checked={newColourVariants} onCheckedChange={setNewColourVariants} />
              <span className="text-muted-foreground">Colour Variants</span>
            </div>
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!newName.trim() || addMutation.isPending}>
              Save
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No categories yet. Add your first category above.</p>
        ) : (
          categories.map((cat, index) => (
            <div key={cat.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 transition-colors hover:bg-accent/30">
              {editingId === cat.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-[200px]" onKeyDown={(e) => e.key === "Enter" && saveEdit()} autoFocus />
                  <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate font-medium">{cat.name}</span>
                  <Badge variant="secondary" className="text-xs">{getProductCount(cat.id)} products</Badge>
                  <button
                    onClick={() => toggleFlag(cat, "has_customisation")}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${cat.has_customisation ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}
                  >
                    Customisation
                  </button>
                  <button
                    onClick={() => toggleFlag(cat, "has_colour_variants")}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${cat.has_colour_variants ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}
                  >
                    Colour Variants
                  </button>
                  <div className="flex items-center gap-0.5">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={() => reorder(index, "up")}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === categories.length - 1} onClick={() => reorder(index, "down")}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(cat)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
            <AlertDialogDescription>
              {deleteTarget && getProductCount(deleteTarget.id) > 0
                ? `This category has ${getProductCount(deleteTarget.id)} products. Deleting it will remove all its products too. Continue?`
                : "This will permanently delete this category."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CategoriesSection;