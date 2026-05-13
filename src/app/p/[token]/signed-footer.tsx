"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck } from "lucide-react";

type Props = {
  signedName: string;
  parentSignedName: string | null;
  signedUnder18: boolean;
  signedAt: string | null;
};

export default function SignedFooter({
  signedName,
  parentSignedName,
  signedUnder18,
  signedAt,
}: Props) {
  const signedDate = signedAt
    ? new Date(signedAt).toLocaleString("en-AU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  return (
    <Card className="border-success/30 bg-success/5">
      <CardContent className="space-y-5 py-6">
        <div className="flex items-center gap-2 text-success">
          <ShieldCheck className="h-5 w-5" />
          <p className="font-heading text-sm font-semibold uppercase tracking-wider">
            Signed and approved
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Player signature
            </p>
            <p
              className="mt-1 text-3xl leading-tight text-foreground"
              style={{ fontFamily: "var(--font-signature)" }}
            >
              {signedName}
            </p>
            <div className="mt-1 border-t pt-1">
              <p className="text-xs text-muted-foreground">{signedName}</p>
            </div>
          </div>

          {signedUnder18 && parentSignedName && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Parent / guardian signature
              </p>
              <p
                className="mt-1 text-3xl leading-tight text-foreground"
                style={{ fontFamily: "var(--font-signature)" }}
              >
                {parentSignedName}
              </p>
              <div className="mt-1 border-t pt-1">
                <p className="text-xs text-muted-foreground">{parentSignedName}</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Signed electronically on {signedDate}
          {signedUnder18 ? " · player is under 18, parent/guardian co-signed" : ""}.
        </p>

        <div className="print:hidden">
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="mr-1.5 h-4 w-4" />
            Save as PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
