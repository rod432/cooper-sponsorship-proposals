"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";

export type PreparedBy = {
  name: string;
  email: string;
  role: string;
  phone: string;
};

type StaffOption = {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PreparedBy;
  onApply: (next: PreparedBy) => void;
};

const CUSTOM_KEY = "__custom__";

export default function PreparedByDialog({
  open,
  onOpenChange,
  value,
  onApply,
}: Props) {
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>(CUSTOM_KEY);
  const [draft, setDraft] = useState<PreparedBy>(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("staff_profiles")
        .select("user_id, email, full_name, role, phone")
        .eq("is_active", true)
        .order("full_name");
      if (cancelled) return;
      const rows = (data ?? []) as StaffOption[];
      setStaff(rows);

      // Try to match current value to a staff member by email.
      const match = rows.find(
        (r) => r.email.toLowerCase() === value.email.toLowerCase() && value.email,
      );
      setSelectedKey(match ? match.user_id : CUSTOM_KEY);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, value]);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    if (key === CUSTOM_KEY) return; // keep existing draft for custom
    const match = staff.find((s) => s.user_id === key);
    if (match) {
      setDraft({
        name: match.full_name || match.email.split("@")[0],
        email: match.email,
        role: match.role,
        phone: match.phone,
      });
    }
  };

  const apply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const isCustom = selectedKey === CUSTOM_KEY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Who is this proposal from?</DialogTitle>
          <DialogDescription>
            This appears under &quot;Prepared by&quot; on the proposal letterhead.
            Defaults to whoever&apos;s signed in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="staff-pick">Staff member</Label>
            <Select value={selectedKey} onValueChange={handleSelect}>
              <SelectTrigger id="staff-pick">
                <SelectValue placeholder="Pick a staff member…" />
              </SelectTrigger>
              <SelectContent>
                {staff.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    No staff profiles yet
                  </SelectItem>
                )}
                {staff.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>
                    {(s.full_name || s.email) +
                      (s.role ? ` — ${s.role}` : "")}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_KEY}>Custom (type details)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Staff list pulls from each user&apos;s profile. Anyone signed in can
              update their own profile.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pb-name" className="text-xs">
                Name
              </Label>
              <Input
                id="pb-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                disabled={!isCustom}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pb-role" className="text-xs">
                Role / title
              </Label>
              <Input
                id="pb-role"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                disabled={!isCustom}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pb-email" className="text-xs">
                Email
              </Label>
              <Input
                id="pb-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                disabled={!isCustom}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pb-phone" className="text-xs">
                Direct phone
              </Label>
              <Input
                id="pb-phone"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                disabled={!isCustom}
              />
            </div>
          </div>
          {!isCustom && (
            <p className="text-xs text-muted-foreground">
              Switch to &quot;Custom&quot; to override these fields directly. To change
              this staff member&apos;s saved details, they need to update their own{" "}
              <strong>Profile</strong> page.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
