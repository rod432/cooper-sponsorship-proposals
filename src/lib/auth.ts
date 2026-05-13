export const ALLOWED_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "coopercricket.com.au";

export function isAllowedEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  if (!lower.includes("@")) return false;
  const domain = lower.split("@").pop();
  return domain === ALLOWED_EMAIL_DOMAIN;
}
