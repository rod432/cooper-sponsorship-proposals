"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onChange: (field: string, value: string) => void;
}

const PlayerDetailsCard = ({ playerName, playerEmail, dealDuration, onChange }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Player Details</CardTitle>
    </CardHeader>
    <CardContent className="grid gap-4 sm:grid-cols-2">
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
      <div className="space-y-2 sm:col-span-2">
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
