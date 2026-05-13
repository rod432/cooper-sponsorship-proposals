"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, MessageSquare } from "lucide-react";
import { submitResponse } from "./actions";

type Choice = "approve" | "decline" | "request_changes";

const labels: Record<Choice, string> = {
  approve: "Approve",
  decline: "Decline",
  request_changes: "Request changes",
};

export default function ResponseForm({ token }: { token: string }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Choice | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!choice) return;
    setError(null);
    startTransition(async () => {
      const res = await submitResponse(token, choice, message);
      if (res.ok) {
        setDone(choice);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  };

  if (done) {
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
    <Card>
      <CardContent className="space-y-4 py-6">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Your response
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose one of the options below. Adding a short note helps Cooper Cricket
            understand your decision.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {(["approve", "request_changes", "decline"] as Choice[]).map((c) => {
            const Icon = c === "approve" ? Check : c === "decline" ? X : MessageSquare;
            const colour =
              c === "approve"
                ? "bg-success text-success-foreground hover:bg-success/90"
                : c === "decline"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-warning text-warning-foreground hover:bg-warning/90";
            return (
              <button
                key={c}
                onClick={() => setChoice(c)}
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

        {choice && (
          <div className="space-y-2">
            <Textarea
              placeholder={
                choice === "approve"
                  ? "Optional: anything you'd like to add."
                  : choice === "decline"
                    ? "Please share why you're declining."
                    : "What changes would you like to see?"
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setChoice(null)} disabled={isPending}>
                Back
              </Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending ? "Submitting…" : `Submit ${labels[choice].toLowerCase()}`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
