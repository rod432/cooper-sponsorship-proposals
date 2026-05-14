"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { COMPANY, addressOneLine } from "@/lib/company-info";

type SendResult = {
  ok: boolean;
  transport: "resend" | "mailto";
  publicUrl: string;
  recipients: string[];
  mailto?: string;
  error?: string;
};

type AdditionalRecipient = {
  email: string;
  name?: string;
  role?: string;
};

const SENDER =
  process.env.RESEND_FROM_ADDRESS ||
  `${COMPANY.tradingName} <proposals@coopercricket.com.au>`;

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent",
  guardian: "Guardian",
  manager: "Manager",
  agent: "Agent",
  coach: "Coach",
  other: "Other",
};

async function inferBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://cooper-sponsorship-proposals.vercel.app";
}

function buildEmail(
  playerName: string,
  link: string,
  reference: string,
  additional: AdditionalRecipient[],
) {
  const refSuffix = reference ? ` (${reference})` : "";
  const subjectName = playerName ? ` for ${playerName}` : "";
  const subject = `${COMPANY.tradingName} Sponsorship Proposal${subjectName}${refSuffix}`;

  // Recipient list (excluding player) shown in the body for transparency —
  // so each recipient knows who else got the email.
  const recipientLines = additional
    .filter((r) => r.email.trim())
    .map((r) => {
      const role = r.role ? ROLE_LABELS[r.role] || r.role : "Copy";
      const who = r.name ? `${r.name} (${r.email})` : r.email;
      return `${role}: ${who}`;
    });

  const subjectOf = playerName
    ? `the sponsorship proposal for ${playerName}`
    : "this sponsorship proposal";

  const text = `${COMPANY.tradingName} has put together ${subjectOf}. Review, approve, or request changes at this link:

${link}

${
  recipientLines.length > 0
    ? `This email has also been sent to:\n${recipientLines.map((l) => `  · ${l}`).join("\n")}\n\n`
    : ""
}If anything looks off or you'd like to talk it through, reply to this email or give us a ring on ${COMPANY.phone}.

Kind regards,
${COMPANY.tradingName}
${COMPANY.phone}  ·  ${COMPANY.email}
${addressOneLine()}`;

  const recipientsHtmlBlock =
    recipientLines.length > 0
      ? `<p style="margin:0 0 6px;font-size:12px;color:#6b7480;">This email has also been sent to:</p>
         <ul style="margin:0 0 22px;padding:0 0 0 18px;font-size:12px;color:#6b7480;line-height:1.6;">
           ${additional
             .filter((r) => r.email.trim())
             .map((r) => {
               const role = r.role ? ROLE_LABELS[r.role] || r.role : "Copy";
               const who = r.name
                 ? `${escapeHtml(r.name)} <span style="color:#9aa3ad;">(${escapeHtml(r.email)})</span>`
                 : escapeHtml(r.email);
               return `<li><strong style="color:#1d2630;">${escapeHtml(role)}:</strong> ${who}</li>`;
             })
             .join("")}
         </ul>`
      : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f7f9;font-family:'Outfit','Helvetica Neue',Arial,sans-serif;color:#1d2630;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:#00B3DC;background-image:linear-gradient(135deg,#0099bf,#00B3DC);padding:28px 32px;color:#ffffff;">
          <div style="font-family:'Outfit','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:20px;letter-spacing:0.5px;">${COMPANY.tradingName.toUpperCase()}</div>
          <div style="margin-top:4px;font-size:12px;opacity:0.9;letter-spacing:1px;text-transform:uppercase;">Sponsorship Proposal${reference ? `  ·  ${escapeHtml(reference)}` : ""}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">${COMPANY.tradingName} has put together ${subjectOf}. Review, approve electronically, or request changes at the link below.</p>
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;background:#00B3DC;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Outfit','Helvetica Neue',Arial,sans-serif;">Review the proposal</a>
          </p>
          <p style="margin:0 0 6px;font-size:12px;color:#6b7480;">Or paste this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;word-break:break-all;"><a href="${link}" style="color:#0099bf;text-decoration:none;">${link}</a></p>
          ${recipientsHtmlBlock}
          <p style="margin:0 0 6px;font-size:14px;line-height:1.5;">If anything looks off or you'd like to talk it through, reply to this email or call us on <strong>${COMPANY.phone}</strong>.</p>
          <p style="margin:18px 0 0;font-size:14px;line-height:1.5;">Kind regards,<br/><strong>${COMPANY.tradingName}</strong></p>
        </td></tr>
        <tr><td style="background:#f4f7f9;padding:18px 32px;border-top:1px solid #e6ebef;font-size:11px;line-height:1.5;color:#6b7480;text-align:center;">
          <strong style="color:#1d2630;">${COMPANY.legalName}</strong>  ·  ABN ${COMPANY.abn}<br/>
          ${addressOneLine()}<br/>
          ${COMPANY.phone}  ·  <a href="mailto:${COMPANY.email}" style="color:#0099bf;text-decoration:none;">${COMPANY.email}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendProposal(
  proposalId: string,
  playerEmailOverride?: string,
) {
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select(
      "id, public_token, player_name, player_email, status, reference, additional_recipients",
    )
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return {
      ok: false,
      transport: "mailto" as const,
      publicUrl: "",
      recipients: [],
      error: "Proposal not found.",
    } satisfies SendResult;
  }

  const playerEmail = (playerEmailOverride ?? proposal.player_email ?? "").trim();
  if (
    playerEmailOverride !== undefined &&
    playerEmailOverride !== proposal.player_email
  ) {
    await supabase
      .from("proposals")
      .update({ player_email: playerEmail })
      .eq("id", proposal.id);
  }

  const extras = ((proposal.additional_recipients as unknown as
    | AdditionalRecipient[]
    | null) ?? []).filter((r) => r.email && r.email.trim().includes("@"));

  const base = await inferBaseUrl();
  const publicUrl = `${base}/p/${proposal.public_token}`;
  const { subject, text, html } = buildEmail(
    proposal.player_name,
    publicUrl,
    proposal.reference ?? "",
    extras,
  );

  // Build the full to: list. Deduplicate case-insensitively, keep player first.
  const seen = new Set<string>();
  const toList: string[] = [];
  const addEmail = (e: string) => {
    const trimmed = e.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    toList.push(trimmed);
  };
  addEmail(playerEmail);
  extras.forEach((r) => addEmail(r.email));

  if (toList.length === 0) {
    return {
      ok: false,
      transport: "resend",
      publicUrl,
      recipients: [],
      error: "No recipient email addresses set.",
    } satisfies SendResult;
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const send = await resend.emails.send({
        from: SENDER,
        to: toList,
        subject,
        text,
        html,
      });
      if (send.error) {
        return {
          ok: false,
          transport: "resend",
          publicUrl,
          recipients: toList,
          error: send.error.message,
        } satisfies SendResult;
      }
      await supabase
        .from("proposals")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", proposal.id);
      revalidatePath("/proposals");
      return {
        ok: true,
        transport: "resend",
        publicUrl,
        recipients: toList,
      } satisfies SendResult;
    } catch (e) {
      return {
        ok: false,
        transport: "resend",
        publicUrl,
        recipients: toList,
        error: e instanceof Error ? e.message : "Resend send failed.",
      } satisfies SendResult;
    }
  }

  // No Resend key — fall back to a mailto link with everyone on To.
  const mailto = `mailto:${encodeURIComponent(toList.join(","))}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(text)}`;
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposal.id);
  revalidatePath("/proposals");
  return {
    ok: true,
    transport: "mailto",
    publicUrl,
    recipients: toList,
    mailto,
  } satisfies SendResult;
}
