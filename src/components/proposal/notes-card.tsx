"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  notes: string;
  onChange: (notes: string) => void;
}

const NotesCard = ({ notes, onChange }: Props) => (
  <Card>
    <CardHeader><CardTitle className="text-lg">Additional Notes</CardTitle></CardHeader>
    <CardContent>
      <Textarea placeholder="Add any additional notes…" value={notes} onChange={(e) => onChange(e.target.value)} rows={4} />
    </CardContent>
  </Card>
);

export default NotesCard;