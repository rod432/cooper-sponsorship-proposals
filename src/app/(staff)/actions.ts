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
  perRecipientGroups: number;
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

// Every outgoing email is BCC'd here for a full team paper trail (minus anyone
// already on the To line). Override with EMAIL_BCC (comma-separated).
const BCC = (process.env.EMAIL_BCC ?? "info@coopercricket.com.au,rod@coopercricket.com.au")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const PARENT_ROLES = new Set(["parent", "guardian"]);

async function inferBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://cooper-sponsorship-proposals.vercel.app";
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------------------------
// Email templates (one per recipient kind).
// ---------------------------------------------------------------------------

type TemplateContext = {
  playerName: string;
  link: string;
  reference: string;
  isUnder18: boolean;
};

function shell(opts: {
  reference: string;
  bodyHtml: string;
}): string {
  const refLabel = opts.reference
    ? `  ·  ${escapeHtml(opts.reference)}`
    : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f7f9;font-family:'Outfit','Helvetica Neue',Arial,sans-serif;color:#1d2630;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f7f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr><td style="background:#00B3DC;background-image:linear-gradient(135deg,#0099bf,#00B3DC);padding:28px 32px;color:#ffffff;">
          <div style="font-family:'Outfit','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:20px;letter-spacing:0.5px;">${COMPANY.tradingName.toUpperCase()}</div>
          <div style="margin-top:4px;font-size:12px;opacity:0.9;letter-spacing:1px;text-transform:uppercase;">Sponsorship Proposal${refLabel}</div>
        </td></tr>
        <tr><td style="padding:32px;">${opts.bodyHtml}</td></tr>
        <tr><td style="background:#f4f7f9;padding:18px 32px;border-top:1px solid #e6ebef;font-size:11px;line-height:1.5;color:#6b7480;text-align:center;">
          <strong style="color:#1d2630;">${COMPANY.legalName}</strong>  ·  ABN ${COMPANY.abn}<br/>
          ${addressOneLine()}<br/>
          ${COMPANY.phone}  ·  <a href="mailto:${COMPANY.email}" style="color:#0099bf;text-decoration:none;">${COMPANY.email}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(link: string, label: string) {
  return `<p style="margin:0 0 28px;text-align:center;">
    <a href="${link}" style="display:inline-block;padding:14px 28px;background:#00B3DC;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;font-family:'Outfit','Helvetica Neue',Arial,sans-serif;">${escapeHtml(label)}</a>
  </p>
  <p style="margin:0 0 6px;font-size:12px;color:#6b7480;">Or paste this link into your browser:</p>
  <p style="margin:0 0 24px;font-size:12px;word-break:break-all;"><a href="${link}" style="color:#0099bf;text-decoration:none;">${link}</a></p>`;
}

function buildPlayerEmail(ctx: TemplateContext) {
  const refSuffix = ctx.reference ? ` (${ctx.reference})` : "";
  const subject = `${COMPANY.tradingName} Sponsorship Proposal${ctx.playerName ? ` for ${ctx.playerName}` : ""}${refSuffix}`;
  const greeting = ctx.playerName ? `Hi ${ctx.playerName.split(" ")[0]},` : "Hi,";

  const under18Note = ctx.isUnder18
    ? "Because you're under 18, your parent or guardian must also sign this proposal. They've been sent their own email with the same link — please make sure they've reviewed it before you sign yours."
    : "";

  const text = `${greeting}

${COMPANY.tradingName} has put together a sponsorship proposal for you. You can review it, approve it electronically, or request changes at this link:

${ctx.link}

${under18Note ? `${under18Note}\n\n` : ""}If anything looks off or you'd like to talk it through, reply to this email or give us a ring on ${COMPANY.phone}.

Kind regards,
${COMPANY.tradingName}`;

  const html = shell({
    reference: ctx.reference,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">${COMPANY.tradingName} has put together a sponsorship proposal for you. Review it, approve electronically, or request changes at the link below.</p>
      ${ctaButton(ctx.link, "Review your proposal")}
      ${
        under18Note
          ? `<div style="margin:0 0 22px;padding:12px 14px;background:#fff7e6;border:1px solid #f3d68a;border-radius:8px;font-size:13px;line-height:1.5;color:#6b4f00;">
              <strong>Parent or guardian signature required.</strong><br/>${escapeHtml(under18Note)}
            </div>`
          : ""
      }
      <p style="margin:0 0 6px;font-size:14px;line-height:1.5;">If anything looks off or you'd like to talk it through, reply to this email or call us on <strong>${COMPANY.phone}</strong>.</p>
      <p style="margin:18px 0 0;font-size:14px;line-height:1.5;">Kind regards,<br/><strong>${COMPANY.tradingName}</strong></p>
    `,
  });

  return { subject, text, html };
}

function buildParentEmail(ctx: TemplateContext, parentName: string | undefined) {
  const refSuffix = ctx.reference ? ` (${ctx.reference})` : "";
  const subject = `Action required: Parent / guardian signature for ${ctx.playerName || "your player"}${refSuffix}`;
  const greeting = parentName ? `Hi ${parentName.split(" ")[0]},` : "Hi,";

  const playerLabel = ctx.playerName || "the player";

  const text = `${greeting}

${COMPANY.tradingName} has prepared a sponsorship proposal for ${playerLabel}, who is under 18.

As parent or guardian, you'll need to provide your typed signature alongside ${playerLabel}'s when the proposal is signed. Both signatures are captured on the same page — please review the details with ${playerLabel} before signing.

Review the proposal here:
${ctx.link}

If anything's unclear, reply to this email or call us on ${COMPANY.phone}.

Kind regards,
${COMPANY.tradingName}`;

  const html = shell({
    reference: ctx.reference,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">${COMPANY.tradingName} has prepared a sponsorship proposal for <strong>${escapeHtml(playerLabel)}</strong>, who is under 18.</p>
      <div style="margin:0 0 22px;padding:14px 16px;background:#fff7e6;border:1px solid #f3d68a;border-radius:8px;font-size:14px;line-height:1.55;color:#6b4f00;">
        <strong>Your signature is required as parent / guardian.</strong><br/>
        When the proposal is signed, both ${escapeHtml(playerLabel)} and you will need to type your full legal names. Both signatures are captured on the same page.
      </div>
      <p style="margin:0 0 6px;font-size:14px;line-height:1.5;">Please review the proposal with ${escapeHtml(playerLabel)} before signing.</p>
      ${ctaButton(ctx.link, "Review the proposal")}
      <p style="margin:0 0 6px;font-size:14px;line-height:1.5;">If anything&rsquo;s unclear, reply to this email or call us on <strong>${COMPANY.phone}</strong>.</p>
      <p style="margin:18px 0 0;font-size:14px;line-height:1.5;">Kind regards,<br/><strong>${COMPANY.tradingName}</strong></p>
    `,
  });

  return { subject, text, html };
}

function buildCopyEmail(ctx: TemplateContext, role: string, name?: string) {
  const refSuffix = ctx.reference ? ` (${ctx.reference})` : "";
  const subject = `FYI: ${COMPANY.tradingName} sponsorship proposal for ${ctx.playerName || "a player"}${refSuffix}`;
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";

  const text = `${greeting}

${COMPANY.tradingName} has sent a sponsorship proposal to ${ctx.playerName || "the player"}. You've been copied in for reference as ${role}.

Review the proposal here:
${ctx.link}

The player will be the one to approve, decline, or request changes${ctx.isUnder18 ? " (their parent or guardian will co-sign)" : ""}. No action is required from you unless ${COMPANY.tradingName} or the player asks for input.

Kind regards,
${COMPANY.tradingName}`;

  const html = shell({
    reference: ctx.reference,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.5;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">${COMPANY.tradingName} has sent a sponsorship proposal to <strong>${escapeHtml(ctx.playerName || "the player")}</strong>. You&rsquo;ve been copied in for reference as <strong>${escapeHtml(role)}</strong>.</p>
      ${ctaButton(ctx.link, "Review the proposal")}
      <p style="margin:0 0 6px;font-size:14px;line-height:1.5;">The player will approve, decline, or request changes${ctx.isUnder18 ? " (their parent or guardian will co-sign)" : ""}. No action is required from you unless ${COMPANY.tradingName} or the player asks for input.</p>
      <p style="margin:18px 0 0;font-size:14px;line-height:1.5;">Kind regards,<br/><strong>${COMPANY.tradingName}</strong></p>
    `,
  });

  return { subject, text, html };
}

function buildManagerEmail(ctx: TemplateContext, name?: string) {
  const refSuffix = ctx.reference ? ` (${ctx.reference})` : "";
  const subject = `Sponsorship proposal for ${ctx.playerName || "your player"} — your review${refSuffix}`;
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi,";
  const playerLabel = ctx.playerName || "your player";
  const text = `${greeting}

${COMPANY.tradingName} has prepared a sponsorship proposal for ${playerLabel}. As their manager, you can review the full details and either approve it or request changes — both options are on the proposal page.

Review the proposal here: ${ctx.link}

If anything looks off or you'd like to talk it through, reply to this email or call ${COMPANY.phone}.`;
  const bodyHtml = `
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">${COMPANY.tradingName} has prepared a sponsorship proposal for <strong>${escapeHtml(playerLabel)}</strong>. As their manager, you can review the full details and either <strong>approve</strong> it or <strong>request changes</strong>.</p>
      <p style="margin:0 0 26px;"><a href="${ctx.link}" style="display:inline-block;background:#0099bf;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;font-weight:600;">Review the proposal</a></p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#5b6670;">If anything looks off or you'd like to talk it through, reply to this email or call ${escapeHtml(COMPANY.phone)}.</p>`;
  return { subject, text, html: shell({ reference: ctx.reference, bodyHtml }) };
}

// ---------------------------------------------------------------------------

type SendOptions = {
  playerEmailOverride?: string;
  includePlayer?: boolean;
  recipients?: AdditionalRecipient[];
};

export async function sendProposal(
  proposalId: string,
  opts: SendOptions | string = {},
) {
  // Back-compat: a bare string argument is treated as a player email override.
  const o: SendOptions =
    typeof opts === "string" ? { playerEmailOverride: opts } : opts;
  const includePlayer = o.includePlayer ?? true;
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select(
      "id, public_token, player_name, player_email, status, reference, additional_recipients, signed_under_18",
    )
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return {
      ok: false,
      transport: "mailto" as const,
      publicUrl: "",
      recipients: [],
      perRecipientGroups: 0,
      error: "Proposal not found.",
    } satisfies SendResult;
  }

  const playerEmail = (o.playerEmailOverride ?? proposal.player_email ?? "").trim();
  if (
    includePlayer &&
    o.playerEmailOverride !== undefined &&
    o.playerEmailOverride !== proposal.player_email
  ) {
    await supabase
      .from("proposals")
      .update({ player_email: playerEmail })
      .eq("id", proposal.id);
  }

  const extras = (o.recipients ?? ((proposal.additional_recipients as unknown as
    | AdditionalRecipient[]
    | null) ?? [])).filter((r) => r.email && r.email.trim().includes("@"));

  const base = await inferBaseUrl();
  const publicUrl = `${base}/p/${proposal.public_token}`;
  const isUnder18 = !!proposal.signed_under_18;

  const ctx: TemplateContext = {
    playerName: proposal.player_name,
    link: publicUrl,
    reference: proposal.reference ?? "",
    isUnder18,
  };

  // Group recipients. Each recipient receives ONE email tailored to their role:
  //   - Player → "Your proposal"
  //   - Parent / Guardian → "Action required" (only when isUnder18)
  //   - Everyone else → FYI / copy
  const parents = extras.filter((r) => PARENT_ROLES.has((r.role ?? "").toLowerCase()));
  const others = extras.filter((r) => !PARENT_ROLES.has((r.role ?? "").toLowerCase()));

  // Dedup helper (we don't want to email the same address twice in one batch).
  const seen = new Set<string>();
  const consume = (email: string): string | null => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return null;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    return trimmed;
  };

  type Send = { to: string[]; subject: string; text: string; html: string };
  const sends: Send[] = [];
  const allRecipients: string[] = [];

  // 1) Player
  const playerTo = includePlayer ? consume(playerEmail) : null;
  if (playerTo) {
    const e = buildPlayerEmail(ctx);
    sends.push({ to: [playerTo], ...e });
    allRecipients.push(playerTo);
  }

  // 2) Parent(s)
  if (isUnder18 && parents.length > 0) {
    // One email per parent so each gets their own greeting / personalisation.
    for (const p of parents) {
      const to = consume(p.email);
      if (!to) continue;
      const e = buildParentEmail(ctx, p.name);
      sends.push({ to: [to], ...e });
      allRecipients.push(to);
    }
  } else if (parents.length > 0) {
    // Adult player but parent on the list — treat as a copy.
    for (const p of parents) {
      const to = consume(p.email);
      if (!to) continue;
      const e = buildCopyEmail(ctx, "Parent / guardian", p.name);
      sends.push({ to: [to], ...e });
      allRecipients.push(to);
    }
  }

  // 3) Other extras (manager, agent, coach, other) — single combined send if
  //    multiple share no personalisation, otherwise one per recipient.
  for (const r of others) {
    const to = consume(r.email);
    if (!to) continue;
    const role = (r.role ?? "other").toLowerCase();
    const roleLabel =
      (r.role ?? "other").charAt(0).toUpperCase() + (r.role ?? "other").slice(1);
    // Managers are decision-makers: they get an actionable email (review,
    // approve, or request changes), not the passive "copied for reference" note.
    const e =
      role === "manager"
        ? buildManagerEmail(ctx, r.name)
        : buildCopyEmail(ctx, roleLabel, r.name);
    sends.push({ to: [to], ...e });
    allRecipients.push(to);
  }

  if (sends.length === 0) {
    return {
      ok: false,
      transport: "resend",
      publicUrl,
      recipients: [],
      perRecipientGroups: 0,
      error: "No recipient email addresses set.",
    } satisfies SendResult;
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const payloads = sends.map((s) => {
        const bcc = BCC.filter(
          (b) => !s.to.some((t) => t.trim().toLowerCase() === b.toLowerCase()),
        );
        return {
          from: SENDER,
          to: s.to,
          ...(bcc.length ? { bcc } : {}),
          subject: s.subject,
          text: s.text,
          html: s.html,
        };
      });

      // Resend's free tier is 2 requests/sec — N parallel sends blow past it
      // when there are 3+ recipients. The batch API delivers up to 100
      // distinct emails in one API call, sidestepping the rate limit and
      // staying within plan quota.
      if (payloads.length === 1) {
        const single = await resend.emails.send(payloads[0]);
        if (single.error) {
          return {
            ok: false,
            transport: "resend",
            publicUrl,
            recipients: allRecipients,
            perRecipientGroups: sends.length,
            error: single.error.message,
          } satisfies SendResult;
        }
      } else {
        const batch = await resend.batch.send(payloads);
        if (batch.error) {
          return {
            ok: false,
            transport: "resend",
            publicUrl,
            recipients: allRecipients,
            perRecipientGroups: sends.length,
            error: batch.error.message,
          } satisfies SendResult;
        }
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
        recipients: allRecipients,
        perRecipientGroups: sends.length,
      } satisfies SendResult;
    } catch (e) {
      return {
        ok: false,
        transport: "resend",
        publicUrl,
        recipients: allRecipients,
        perRecipientGroups: sends.length,
        error: e instanceof Error ? e.message : "Resend send failed.",
      } satisfies SendResult;
    }
  }

  // No Resend key — fall back to a single mailto that opens with everyone on
  // To:. The personalised bodies are lost in this mode, but it's good enough
  // for local dev.
  const fallback = sends[0]; // use the player template for the subject/body
  const mailto = `mailto:${encodeURIComponent(allRecipients.join(","))}?subject=${encodeURIComponent(
    fallback.subject,
  )}&body=${encodeURIComponent(fallback.text)}`;
  await supabase
    .from("proposals")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", proposal.id);
  revalidatePath("/proposals");
  return {
    ok: true,
    transport: "mailto",
    publicUrl,
    recipients: allRecipients,
    perRecipientGroups: sends.length,
    mailto,
  } satisfies SendResult;
}
