"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requestMagicLink } from "./actions";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", email);
      const res = await requestMagicLink(fd);
      if (res.ok) {
        setSent(true);
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="space-y-2 py-6 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">
            Check your email.
          </p>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a sign-in link to <strong>{email}</strong>. The link
            works for one hour.
          </p>
          <Button variant="ghost" size="sm" onClick={() => { setSent(false); setEmail(""); }}>
            Use a different email
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-6">
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              placeholder="you@coopercricket.com.au"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Sending link…" : "Send sign-in link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
