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
  mailto?: string;
  error?: string;
};

const SENDER =
  process.env.RESEND_FROM_ADDRESS ||
  `${COMPANY.tradingName} <proposals@coopercricket.com.au>`;

async function inferBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://cooper-sponsorship-proposals.vercel.app";
}

function buildEmail(playerName: string, link: string, reference: string) {
  const refSuffix = reference ? ` (${reference})` : "";
  const subject = `${COMPANY.tradingName} Sponsorship Proposal${playerName ? ` for ${playerName}` : ""}${refSuffix}`;
  const greeting = playerName ? `Hi ${playerName.split(" ")[0]},` : "Hi,";

  const text = `${greeting}

${COMPANY.tradingName} has put together a sponsorship proposal for you. You can review it, approve it, or request changes at this link:

${link}

If anything looks off or you'd like to talk it through, reply to this email or give us a ring on ${COMPANY.phone}.

Kind regards,
${COMPANY.tradingName}
${COMPANY.phone}  ·  ${COMPANY.email}
${addressOneLine()}`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f7f9;font-family:'Outfit','Helvetica Neue',Arial,sans-serif;color:#1d2630;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:#00B3DC;background-image:linear-gradient(135deg,#0099bf,#00B3DC);padding:28px 32px;color:#ffffff;">
          <div style="font-family:'Outfit','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:20px;letter-spacing:0.5px;">${COMPANY.tradingName.toUpperCase()}</div>
          <div style="margin-top:4px;font-size:12px;opacity:0.9;letter-spacing:1px;text-transform:uppercase;">Sponsorship Proposal${reference ? `  ·  ${reference}` : ""}</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">${greeting}</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">${COMPANY.tradingName} has put together a sponsorship proposal for you. You can review it, approve it electronically, or request changes at the link below.</p>
          <p style="margin:0 0 28px;text-align:center;">
            <a href="${link}" style="display:inline-block;padding:14px 28px;background:#00B3DC;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Outfit','Helvetica Neue',Arial,sans-serif;">Review your proposal</a>
          </p>
          <p style="margin:0 0 6px;font-size:12px;color:#6b7480;">Or paste this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:12px;word-break:break-all;"><a href="${link}" style="color:#0099bf;text-decoration:none;">${link}</a></p>
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

export async function sendProposal(proposalId: string, playerEmailOverride?: string) {
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, public_token, player_name, player_email, status, reference")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return { ok: false, transport: "mailto" as const, publicUrl: "", error: "Proposal not found." } satisfies SendResult;
  }

  const playerEmail = (playerEmailOverride ?? proposal.player_email ?? "").trim();
  if (playerEmailOverride !== undefined && playerEmailOverride !== proposal.player_email) {
    await supabase
      .from("proposals")
      .update({ player_email: playerEmail })
      .eq("id", proposal.id);
  }

  const base = await inferBaseUrl();
  const publicUrl = `${base}/p/${proposal.public_token}`;
  const { subject, text, html } = buildEmail(
    proposal.player_name,
    publicUrl,
    proposal.reference ?? "",
  );

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const send = await resend.emails.send({
        from: SENDER,
        to: playerEmail,
        subject,
        text,
        html,
      });
      if (send.error) {
        return {
          ok: false,
          transport: "resend",
          publicUrl,
          error: send.error.message,
        } satisfies SendResult;
      }
      await supabase
        .from("proposals")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", proposal.id);
      revalidatePath("/proposals");
      return { ok: true, transport: "resend", publicUrl } satisfies SendResult;
    } catch (e) {
      return {
        ok: false,
        transport: "resend",
        publicUrl,
        error: e instanceof Error ? e.message : "Resend send failed.",
      } satisfies SendResult;
    }
  }

  // No Resend key — fall back to a mailto link the staff member can click.
  const mailto = `mailto:${encodeURIComponent(playerEmail)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(text)}`;
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposal.id);
  revalidatePath("/proposals");
  return { ok: true, transport: "mailto", publicUrl, mailto } satisfies SendResult;
}
