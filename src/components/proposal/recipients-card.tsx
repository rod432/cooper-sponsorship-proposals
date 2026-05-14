"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Mail } from "lucide-react";

export type AdditionalRecipient = {
  email: string;
  name: string;
  role: "parent" | "guardian" | "manager" | "agent" | "coach" | "other";
};

const ROLE_OPTIONS: { value: AdditionalRecipient["role"]; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "guardian", label: "Guardian" },
  { value: "manager", label: "Manager" },
  { value: "agent", label: "Agent" },
  { value: "coach", label: "Coach" },
  { value: "other", label: "Other" },
];

export const ROLE_LABELS: Record<AdditionalRecipient["role"], string> =
  Object.fromEntries(ROLE_OPTIONS.map((o) => [o.value, o.label])) as Record<
    AdditionalRecipient["role"],
    string
  >;

interface Props {
  playerEmail: string;
  playerName: string;
  recipients: AdditionalRecipient[];
  isUnder18: boolean;
  onChange: (recipients: AdditionalRecipient[]) => void;
}

const RecipientsCard = ({
  playerEmail,
  playerName,
  recipients,
  isUnder18,
  onChange,
}: Props) => {
  const updateAt = (i: number, patch: Partial<AdditionalRecipient>) => {
    onChange(recipients.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  };

  const removeAt = (i: number) => {
    onChange(recipients.filter((_, j) => j !== i));
  };

  const add = (role: AdditionalRecipient["role"] = "parent") => {
    onChange([...recipients, { email: "", name: "", role }]);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Send a copy to</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Primary recipient — always the player, locked */}
        <div className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5">
          <Mail className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Player
            </p>
            <p className="truncate text-sm text-foreground">
              {playerEmail.trim() ? (
                <>
                  {playerName ? <span>{playerName} · </span> : null}
                  {playerEmail}
                </>
              ) : (
                <span className="italic text-muted-foreground">
                  Add the player&apos;s email on the Player Details card above
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Additional recipients */}
        {recipients.map((r, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-md border bg-secondary/30 px-3 py-2.5 sm:flex-row sm:items-center"
          >
            <div className="min-w-[110px] sm:w-32">
              <Label htmlFor={`recipient-role-${i}`} className="sr-only">
                Role
              </Label>
              <Select
                value={r.role}
                onValueChange={(v) =>
                  updateAt(i, { role: v as AdditionalRecipient["role"] })
                }
              >
                <SelectTrigger id={`recipient-role-${i}`} className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="text"
              placeholder="Name (optional)"
              value={r.name}
              onChange={(e) => updateAt(i, { name: e.target.value })}
              className="h-8 flex-1 text-sm"
            />
            <Input
              type="email"
              placeholder="email@example.com"
              value={r.email}
              onChange={(e) => updateAt(i, { email: e.target.value })}
              className="h-8 flex-1 text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeAt(i)}
              title="Remove recipient"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-1">
          {isUnder18 && !recipients.some((r) => r.role === "parent" || r.role === "guardian") && (
            <Button variant="outline" size="sm" onClick={() => add("parent")}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add parent / guardian
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => add(isUnder18 ? "parent" : "manager")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add another recipient
          </Button>
        </div>

        <p className="pt-1 text-xs text-muted-foreground">
          Everyone listed here gets the same email with a link to review the
          proposal. The player is always the primary recipient.
          {isUnder18
            ? " Because this player is under 18, add a parent or guardian here so they receive a copy and can co-sign."
            : ""}
        </p>
      </CardContent>
    </Card>
  );
};

export default RecipientsCard;
