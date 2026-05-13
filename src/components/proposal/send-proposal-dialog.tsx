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
import { Copy, Mail } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string | null;
  initialEmail?: string;
  onSent?: () => void;
};

export default function SendProposalDialog({
  open,
  onOpenChange,
  proposalId,
  initialEmail = "",
  onSent,
}: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    transport: "resend" | "mailto";
    publicUrl: string;
    mailto?: string;
  } | null>(null);

  const reset = () => {
    setResult(null);
    setEmail(initialEmail);
  };

  const submit = () => {
    if (!proposalId) return;
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
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
        mailto: res.mailto,
      });
      onSent?.();
      if (res.transport === "resend") {
        toast({ title: "Email sent", description: `Delivered to ${email.trim()}` });
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
              <DialogTitle>Send proposal to player</DialogTitle>
              <DialogDescription>
                The player will get a link to review, approve, decline, or request
                changes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
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
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={isPending || !proposalId}>
                {isPending ? "Sending…" : "Send"}
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
                  ? `The proposal email was sent to ${email}.`
                  : "Resend isn't configured, so click below to open your mail client with the message pre-filled. Or copy the link and send it however you prefer."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Player link</Label>
              <div className="flex gap-2">
                <Input value={result.publicUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" onClick={copyLink} title="Copy link">
                  <Copy className="h-4 w-4" />
                </Button>
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
