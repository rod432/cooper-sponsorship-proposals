"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "./actions";

type Props = {
  email: string;
  initialFullName: string;
  initialRole: string;
  initialPhone: string;
};

export default function ProfileForm({
  email,
  initialFullName,
  initialRole,
  initialPhone,
}: Props) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(initialFullName);
  const [role, setRole] = useState(initialRole);
  const [phone, setPhone] = useState(initialPhone);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("fullName", fullName);
      fd.set("role", role);
      fd.set("phone", phone);
      const res = await updateProfile(fd);
      if (res.ok) {
        toast({ title: "Profile saved" });
      } else {
        toast({
          title: "Save failed",
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sign-in details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled readOnly className="bg-secondary/40" />
            <p className="text-xs text-muted-foreground">
              Email can&apos;t be changed here — it&apos;s how you sign in.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              placeholder="e.g. Rod Grey"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role / title</Label>
            <Input
              id="role"
              placeholder="e.g. Director, Sponsorship Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shows under your name on the proposal letterhead.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Direct phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. 0400 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <p className="text-xs text-muted-foreground">
              If set, appears on the proposal so the player can call you directly.
              Leave blank to use the company line only.
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
