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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="player-name">Player Name</Label>
          <Input
            id="player-name"
            placeholder="e.g. Sam Smith"
            value={playerName}
            onChange={(e) => onChange("playerName", e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="player-category">Age Category</Label>
          <Select
            value={isUnder18 ? "youth" : "adult"}
            onValueChange={(v) => onChange("isUnder18", v === "youth")}
          >
            <SelectTrigger id="player-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adult">Adult (18+)</SelectItem>
              <SelectItem value="youth">Youth (under 18)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isUnder18
              ? "A parent or guardian will also need to sign the agreement."
              : "Player will sign the agreement on their own."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="player-email">Player Email</Label>
          <Input
            id="player-email"
            type="email"
            placeholder="player@example.com"
            value={playerEmail}
            onChange={(e) => onChange("playerEmail", e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deal-duration">Sponsorship Term</Label>
          <Select value={dealDuration} onValueChange={(v) => onChange("dealDuration", v)}>
            <SelectTrigger id="deal-duration">
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
    </CardContent>
  </Card>
);

export default PlayerDetailsCard;
