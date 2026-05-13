"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, ChevronUp, ChevronDown, Pencil, Trash2, X, Check } from "lucide-react";

const Terms = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ["standard_terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standard_terms")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxSort = terms.length > 0 ? Math.max(...terms.map((t) => t.sort_order)) + 1 : 0;
      const { error } = await supabase.from("standard_terms").insert({
        title: newTitle.trim(),
        body: newBody.trim(),
        sort_order: maxSort,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard_terms"] });
      setNewTitle("");
      setNewBody("");
      setShowAdd(false);
      toast({ title: "Term added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, title, body }: { id: string; title: string; body: string }) => {
      const { error } = await supabase.from("standard_terms").update({ title, body }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard_terms"] });
      setEditingId(null);
      toast({ title: "Term updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("standard_terms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard_terms"] });
      toast({ title: "Term deleted" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id1, sort1, id2, sort2 }: { id1: string; sort1: number; id2: string; sort2: number }) => {
      await supabase.from("standard_terms").update({ sort_order: sort2 }).eq("id", id1);
      await supabase.from("standard_terms").update({ sort_order: sort1 }).eq("id", id2);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard_terms"] });
    },
  });

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const current = terms[index];
    const prev = terms[index - 1];
    reorderMutation.mutate({ id1: current.id, sort1: current.sort_order, id2: prev.id, sort2: prev.sort_order });
  };

  const handleMoveDown = (index: number) => {
    if (index === terms.length - 1) return;
    const current = terms[index];
    const next = terms[index + 1];
    reorderMutation.mutate({ id1: current.id, sort1: current.sort_order, id2: next.id, sort2: next.sort_order });
  };

  const startEdit = (term: typeof terms[0]) => {
    setEditingId(term.id);
    setEditTitle(term.title);
    setEditBody(term.body);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Standard Terms</h1>
        {!showAdd && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Term
          </Button>
        )}
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-lg">New Term</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Textarea placeholder="Body text" value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={4} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => addMutation.mutate()} disabled={!newTitle.trim() || !newBody.trim()}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewTitle(""); setNewBody(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : terms.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No standard terms yet. Add one above.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {terms.map((term, i) => (
            <Card key={term.id}>
              <CardContent className="py-4">
                {editingId === term.id ? (
                  <div className="space-y-3">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: term.id, title: editTitle.trim(), body: editBody.trim() })} disabled={!editTitle.trim() || !editBody.trim()}>
                        <Check className="mr-1.5 h-4 w-4" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="mr-1.5 h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 font-heading text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-semibold text-foreground">{term.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{term.body}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveUp(i)} disabled={i === 0}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMoveDown(i)} disabled={i === terms.length - 1}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(term)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete term?</AlertDialogTitle>
                            <AlertDialogDescription>"{term.title}" will be permanently removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(term.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Terms;