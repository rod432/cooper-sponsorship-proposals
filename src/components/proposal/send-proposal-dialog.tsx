"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendProposal } from "@/app/(staff)/actions";
import { Copy, Mail, Users } from "lucide-react";
import type { AdditionalRecipient } from "./recipients-card";
import { ROLE_LABELS } from "./recipients-card";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string | null;
  initialEmail?: string;
  additionalRecipients?: AdditionalRecipient[];
  onSent?: () => void;
};

export default function SendProposalDialog({
  open,
  onOpenChange,
  proposalId,
  initialEmail = "",
  additionalRecipients = [],
  onSent,
}: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    transport: "resend" | "mailto";
    publicUrl: string;
    recipients: string[];
    mailto?: string;
  } | null>(null);

  const validExtras = additionalRecipients.filter((r) =>
    r.email.trim().includes("@"),
  );

  const reset = () => {
    setResult(null);
    setEmail(initialEmail);
  };

  const submit = () => {
    if (!proposalId) return;
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Please enter a valid player email", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const res = await sendProposal(proposalId, email.trim());
      if (!res.ok) {
        toast({ title: "Send failed", description: res.error, variant: "destructive" });
        return;
      }
      setResult({
        transport: res.transport,
        publicUrl: res.publicUrl,
        recipients: res.recipients,
        mailto: res.mailto,
      });
      onSent?.();
      if (res.transport === "resend") {
        toast({
          title: "Email sent",
          description: `Delivered to ${res.recipients.length} recipient${res.recipients.length === 1 ? "" : "s"}`,
        });
      }
    });
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.publicUrl);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn't copy", description: "Select the link manually." });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Send proposal</DialogTitle>
              <DialogDescription>
                Every recipient below gets the same link to review, approve,
                decline, or request changes.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="player-email">Player email</Label>
                <Input
                  id="player-email"
                  type="email"
                  placeholder="player@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              {validExtras.length > 0 && (
                <div className="rounded-md border bg-secondary/30 px-3 py-2.5">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3 w-3" /> Copied to
                  </p>
                  <ul className="space-y-0.5 text-sm">
                    {validExtras.map((r, i) => (
                      <li key={i} className="truncate text-foreground">
                        <span className="font-medium">{ROLE_LABELS[r.role]}:</span>{" "}
                        {r.name ? `${r.name} · ` : ""}
                        <span className="text-muted-foreground">{r.email}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Edit this list on the Edit tab → &quot;Send a copy to&quot;.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isPending || !proposalId}>
                {isPending
                  ? "Sending…"
                  : `Send to ${1 + validExtras.length} recipient${validExtras.length === 0 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {result.transport === "resend" ? "Email sent" : "Open your mail client"}
              </DialogTitle>
              <DialogDescription>
                {result.transport === "resend"
                  ? `Delivered to ${result.recipients.length} recipient${result.recipients.length === 1 ? "" : "s"}.`
                  : "Resend isn't configured, so click below to open your mail client with everyone on the To: line and the message pre-filled."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Recipients
                </Label>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {result.recipients.map((email, i) => (
                    <li key={i} className="truncate text-foreground">
                      {email}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Player link</Label>
                <div className="flex gap-2">
                  <Input value={result.publicUrl} readOnly className="font-mono text-xs" />
                  <Button variant="outline" onClick={copyLink} title="Copy link">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              {result.transport === "mailto" && result.mailto && (
                <Button asChild>
                  <a href={result.mailto}>
                    <Mail className="mr-1.5 h-4 w-4" />
                    Open in mail client
                  </a>
                </Button>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
