/**
 * Parses a deal-duration string like "1 Year" / "5 Years" into a number of
 * years. Defaults to 1 if the string isn't recognised.
 */
export function parseYearsFromDuration(duration: string): number {
  const m = duration.trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

/**
 * Adds N years to a given date, preserving month/day where possible.
 * Returns an ISO timestamp.
 */
export function addYearsIso(startIso: string, years: number): string {
  const d = new Date(startIso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

export type CountdownTone = "ok" | "warn" | "expiring" | "expired";

export type ExpiryInfo = {
  expiresAt: Date;
  formattedDate: string;
  countdown: string;
  tone: CountdownTone;
  daysRemaining: number;
};

/**
 * Build display-ready expiry info from an ISO timestamp.
 *   - tone "ok" = > 90 days remaining
 *   - tone "warn" = 30–90 days
 *   - tone "expiring" = 0–30 days
 *   - tone "expired" = past
 */
export function buildExpiryInfo(expiresAtIso: string): ExpiryInfo {
  const expiresAt = new Date(expiresAtIso);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / msPerDay);

  const formattedDate = expiresAt.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let countdown: string;
  let tone: CountdownTone;

  if (daysRemaining < 0) {
    const past = Math.abs(daysRemaining);
    countdown =
      past < 30
        ? `Expired ${past} day${past === 1 ? "" : "s"} ago`
        : `Expired ${formattedDate}`;
    tone = "expired";
  } else if (daysRemaining === 0) {
    countdown = "Expires today";
    tone = "expiring";
  } else if (daysRemaining <= 30) {
    countdown = `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
    tone = "expiring";
  } else if (daysRemaining <= 90) {
    countdown = `${daysRemaining} days remaining`;
    tone = "warn";
  } else {
    const years = Math.floor(daysRemaining / 365);
    const months = Math.floor((daysRemaining % 365) / 30);
    const parts: string[] = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    if (parts.length === 0) parts.push(`${daysRemaining}d`);
    countdown = `${parts.join(" ")} remaining`;
    tone = "ok";
  }

  return { expiresAt, formattedDate, countdown, tone, daysRemaining };
}

export const COUNTDOWN_TONE_CLASSES: Record<CountdownTone, string> = {
  ok: "bg-success/10 text-success",
  warn: "bg-warning/10 text-warning",
  expiring: "bg-warning/15 text-warning",
  expired: "bg-destructive/10 text-destructive",
};
