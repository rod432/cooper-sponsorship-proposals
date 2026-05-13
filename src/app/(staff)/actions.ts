"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

type SendResult = {
  ok: boolean;
  transport: "resend" | "mailto";
  publicUrl: string;
  mailto?: string;
  error?: string;
};

const SENDER =
  process.env.RESEND_FROM_ADDRESS || "Cooper Cricket <proposals@coopercricket.com.au>";

async function inferBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://cooper-sponsorship-proposals.vercel.app";
}

function buildEmail(playerName: string, link: string) {
  const subject = `Cooper Cricket Sponsorship Proposal${playerName ? ` for ${playerName}` : ""}`;
  const greeting = playerName ? `Hi ${playerName.split(" ")[0]},` : "Hi,";
  const text = `${greeting}

Cooper Cricket has put together a sponsorship proposal for you. You can review it, approve it, or request changes at this link:

${link}

If anything looks off or you'd like to talk it through, reply to this email.

Kind regards,
Cooper Cricket`;

  const html = `
    <p>${greeting}</p>
    <p>Cooper Cricket has put together a sponsorship proposal for you. You can review it, approve it, or request changes at the link below.</p>
    <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0a7fa6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Review your proposal</a></p>
    <p style="font-size:12px;color:#666;">Or copy this link into your browser: <br/><a href="${link}">${link}</a></p>
    <p>If anything looks off or you'd like to talk it through, reply to this email.</p>
    <p>Kind regards,<br/>Cooper Cricket</p>
  `;

  return { subject, text, html };
}

export async function sendProposal(proposalId: string, playerEmailOverride?: string) {
  const supabase = await createClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, public_token, player_name, player_email, status")
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
  const { subject, text, html } = buildEmail(proposal.player_name, publicUrl);

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
