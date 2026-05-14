"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Copy, Plus, Search, ExternalLink, MessageSquare } from "lucide-react";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  calcProposalTotals,
} from "@/lib/proposal-totals";
import { buildExpiryInfo, COUNTDOWN_TONE_CLASSES } from "@/lib/expiry";
import type { ProposalItem } from "@/components/proposal/equipment-catalog-card";
import type { Tables } from "@/lib/supabase/types";

type ProposalRow = Tables<"proposals"> & {
  proposal_responses: { id: string; response_type: string; responded_at: string }[];
};

const STATUS_FILTERS = ["all", "draft", "sent", "approved", "declined", "changes_requested"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function ProposalsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<ProposalRow | null>(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, proposal_responses(id, response_type, responded_at)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as ProposalRow[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
      setDeleteTarget(null);
      toast({ title: "Proposal deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (source: ProposalRow) => {
      const { error } = await supabase.from("proposals").insert({
        player_name: source.player_name ? `${source.player_name} (copy)` : "",
        deal_duration: source.deal_duration,
        items: source.items,
        discount_percent: source.discount_percent,
        cash_incentive: source.cash_incentive,
        clauses: source.clauses,
        terms: source.terms,
        notes: source.notes,
        ai_image_rights: source.ai_image_rights,
        photo_provisions: source.photo_provisions,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
      toast({ title: "Proposal duplicated" });
    },
  });

  const filtered = proposals.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.player_name.toLowerCase().includes(q) ||
      p.player_email.toLowerCase().includes(q)
    );
  });

  const fmtMoney = (n: number) =>
    `$${n.toLocaleString("en-AU", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Proposals</h1>
        <Button asChild size="sm">
          <Link href="/">
            <Plus className="mr-1.5 h-4 w-4" /> New Proposal
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by player name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {proposals.length === 0
              ? "No proposals yet. Create one to get started."
              : "No proposals match those filters."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const items = (p.items as unknown as ProposalItem[]) ?? [];
            const totals = calcProposalTotals(
              items,
              Number(p.discount_percent),
              Number(p.cash_incentive),
            );
            const responses = p.proposal_responses ?? [];
            const latestResponse = responses.length
              ? responses
                  .slice()
                  .sort((a, b) =>
                    new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime(),
                  )[0]
              : null;
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-heading font-semibold text-foreground">
                        {p.player_name || "Unnamed proposal"}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_BADGE_CLASSES[p.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                      {p.reference && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {p.reference}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.deal_duration || "No duration set"} ·{" "}
                      <span className="font-mono">{fmtMoney(totals.totalValue)}</span> ·{" "}
                      Updated {fmtDate(p.updated_at)}
                    </p>
                    {p.player_email && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.player_email}</p>
                    )}
                    {p.status === "approved" && p.expires_at && (() => {
                      const exp = buildExpiryInfo(p.expires_at);
                      return (
                        <span
                          className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COUNTDOWN_TONE_CLASSES[exp.tone]}`}
                        >
                          {exp.countdown} · expires {exp.formattedDate}
                        </span>
                      );
                    })()}
                    {latestResponse && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" />
                        Latest response: <strong>{latestResponse.response_type}</strong> ·{" "}
                        {fmtDate(latestResponse.responded_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {(p.status === "sent" ||
                      p.status === "approved" ||
                      p.status === "declined" ||
                      p.status === "changes_requested") && (
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open player view">
                        <a
                          href={`/p/${p.public_token}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit"
                    >
                      <Link href={`/?editId=${p.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Duplicate"
                      onClick={() => duplicateMutation.mutate(p)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Delete"
                      onClick={() => setDeleteTarget(p)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.player_name || "Unnamed proposal"}&quot; and any responses
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
