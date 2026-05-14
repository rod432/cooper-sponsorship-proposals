"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  playerName: string;
  playerEmail: string;
  dealDuration: string;
  isUnder18: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

const PlayerDetailsCard = ({
  playerName,
  playerEmail,
  dealDuration,
  isUnder18,
  onChange,
}: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Player Details</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Under-18 status comes first so it's a deliberate decision at the
          start of the proposal. Drives the signing flow on the player side. */}
      <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2.5">
        <Checkbox
          id="is-under-18"
          checked={isUnder18}
          onCheckedChange={(v) => onChange("isUnder18", v === true)}
          className="mt-0.5"
        />
        <div>
          <Label htmlFor="is-under-18" className="font-heading text-sm font-semibold">
            Player is under 18
          </Label>
          <p className="text-xs text-muted-foreground">
            Tick if the player is a minor. The agreement will require a parent or
            guardian to also sign.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Player Name</Label>
          <Input
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => onChange("playerName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Deal Duration</Label>
          <Select value={dealDuration} onValueChange={(v) => onChange("dealDuration", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1} Year${i > 0 ? "s" : ""}`}>
                  {i + 1} Year{i > 0 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Player Email</Label>
        <Input
          type="email"
          placeholder="player@example.com — used when sending the proposal"
          value={playerEmail}
          onChange={(e) => onChange("playerEmail", e.target.value)}
        />
      </div>
    </CardContent>
  </Card>
);

export default PlayerDetailsCard;
