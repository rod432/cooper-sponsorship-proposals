"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, MessageSquare, Pencil, ShieldAlert } from "lucide-react";
import { submitResponse } from "./actions";

type Choice = "approve" | "decline" | "request_changes";

const labels: Record<Choice, string> = {
  approve: "Approve & Sign",
  decline: "Decline",
  request_changes: "Request changes",
};

type Props = {
  token: string;
  defaultPlayerName?: string;
  /** Whether this proposal requires a parent/guardian co-signature.
   *  Set by staff on the proposal record — the player can't override it. */
  isUnder18: boolean;
};

export default function ResponseForm({
  token,
  defaultPlayerName = "",
  isUnder18,
}: Props) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [message, setMessage] = useState("");
  const [signedName, setSignedName] = useState(defaultPlayerName);
  const [parentSignedName, setParentSignedName] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Choice | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!choice) return;
    setError(null);

    if (choice === "approve") {
      if (signedName.trim().length < 2) {
        setError("Please type your full legal name to sign.");
        return;
      }
      if (isUnder18 && parentSignedName.trim().length < 2) {
        setError("A parent or guardian also needs to type their full name.");
        return;
      }
      if (!agree) {
        setError("Please tick the box to confirm you agree to the terms.");
        return;
      }
    } else if (message.trim().length === 0) {
      setError("Please add a short note so Cooper Cricket understands what's needed.");
      return;
    }

    startTransition(async () => {
      const res = await submitResponse({
        token,
        responseType: choice,
        message,
        signedName: choice === "approve" ? signedName.trim() : "",
        parentSignedName:
          choice === "approve" && isUnder18 ? parentSignedName.trim() : "",
      });
      if (res.ok) {
        setDone(choice);
        if (choice === "approve") {
          window.location.reload();
        }
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  };

  if (done && done !== "approve") {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">
            Thanks — your response has been recorded.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cooper Cricket will be in touch shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Under-18 status banner — shown only when set by staff. The player
          can't change this. */}
      {isUnder18 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-3 py-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div className="space-y-1">
              <p className="font-heading text-sm font-semibold text-foreground">
                Parent or guardian signature required
              </p>
              <p className="text-xs text-muted-foreground">
                Cooper Cricket has flagged this proposal as for a player under 18.
                When you sign, your parent or guardian must also type their full
                name to co-sign. They&apos;ll have received their own email about
                this — if not, please make sure they review the proposal before
                you sign.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 py-6">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Your response
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose one of the options below.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {(["approve", "request_changes", "decline"] as Choice[]).map((c) => {
              const Icon =
                c === "approve" ? Check : c === "decline" ? X : MessageSquare;
              const colour =
                c === "approve"
                  ? "bg-success text-success-foreground hover:bg-success/90 border-success"
                  : c === "decline"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive"
                    : "bg-warning text-warning-foreground hover:bg-warning/90 border-warning";
              return (
                <button
                  key={c}
                  onClick={() => {
                    setChoice(c);
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                    choice === c
                      ? colour
                      : "bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {labels[c]}
                </button>
              );
            })}
          </div>

          {choice === "approve" && (
            <div className="space-y-4 rounded-lg border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Pencil className="h-4 w-4" />
                Sign your name
              </div>

              <SignatureField
                id="player-signature"
                label="Player&rsquo;s full legal name"
                value={signedName}
                onChange={setSignedName}
              />

              {isUnder18 && (
                <SignatureField
                  id="parent-signature"
                  label="Parent or guardian's full legal name"
                  value={parentSignedName}
                  onChange={setParentSignedName}
                />
              )}

              <div className="flex items-start gap-2 pt-2">
                <input
                  id="agree"
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="agree" className="text-xs leading-relaxed text-foreground">
                  By typing my name above and clicking{" "}
                  <strong>Approve &amp; Sign</strong>, I agree this serves as my
                  electronic signature
                  {isUnder18 ? " (and the parent or guardian's signature) " : " "}
                  and that I am bound by the terms of this sponsorship proposal.
                </Label>
              </div>
            </div>
          )}

          {choice && choice !== "approve" && (
            <Textarea
              placeholder={
                choice === "decline"
                  ? "Please share why you're declining."
                  : "What changes would you like to see?"
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {choice && (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setChoice(null);
                  setError(null);
                }}
                disabled={isPending}
              >
                Back
              </Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending ? "Submitting…" : labels[choice]}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SignatureField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type the full legal name"
        autoComplete="name"
      />
      <div className="rounded-md border border-dashed bg-background px-3 py-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Signature preview
        </p>
        <p
          className="mt-1 font-signature text-3xl leading-tight text-foreground"
          style={{ fontFamily: "var(--font-signature)" }}
        >
          {value.trim() || " "}
        </p>
      </div>
    </div>
  );
}
