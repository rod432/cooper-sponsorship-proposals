"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import type { TablesUpdate } from "@/lib/supabase/types";
import { addYearsIso, parseYearsFromDuration } from "@/lib/expiry";
import { COMPANY } from "@/lib/company-info";

// Notify staff (info@coopercricket.com.au) when a recipient responds, so they
// know the next step. Best-effort: never blocks or fails the player's action.
async function notifyStaff(opts: {
  playerName: string;
  reference: string | null;
  event: string;
  message?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.STAFF_NOTIFY_EMAIL || COMPANY.email;
  const from =
    process.env.RESEND_FROM_ADDRESS ||
    `${COMPANY.tradingName} <proposals@coopercricket.com.au>`;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sponsorship.coopercricket.com.au";
  const who = `${opts.playerName || "A player"}${opts.reference ? ` (${opts.reference})` : ""}`;
  const lines = [
    `${who}: ${opts.event}.`,
    opts.message ? `\nTheir note:\n${opts.message}` : "",
    `\nReview it: ${base}/proposals`,
  ].filter(Boolean);
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from,
      to,
      subject: `Proposal ${opts.event}: ${opts.playerName || "player"}`,
      text: lines.join("\n"),
    });
  } catch (e) {
    console.error("staff notify failed", e);
  }
}

// Confirmation to the player once their proposal is fully signed. Best-effort.
async function notifyPlayerSigned(opts: {
  to: string;
  playerName: string;
  reference: string | null;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to.trim()) return;
  const from =
    process.env.RESEND_FROM_ADDRESS ||
    `${COMPANY.tradingName} <proposals@coopercricket.com.au>`;
  const first = (opts.playerName || "there").split(" ")[0];
  const text = `Hi ${first},\n\nThank you for signing your Cooper Cricket sponsorship agreement${opts.reference ? ` (${opts.reference})` : ""}. It is now locked in and a copy is kept on file.\n\nWe are thrilled to have you on board and we will be in touch about your gear and next steps.\n\nWelcome to the team,\nThe Cooper Cricket team`;
  try {
    const resend = new Resend(key);
    await resend.emails.send({
      from,
      to: opts.to,
      subject: "Your Cooper Cricket sponsorship is signed",
      text,
    });
  } catch (e) {
    console.error("player notify failed", e);
  }
}

const STATUS_FROM_RESPONSE: Record<string, string> = {
  approve: "approved",
  decline: "declined",
  request_changes: "changes_requested",
};

type Input = {
  token: string;
  responseType: "approve" | "decline" | "request_changes";
  message: string;
  signedName: string;
  parentSignedName: string;
  // For under-18 proposals the player and parent/guardian sign independently.
  // This says who is signing right now. Ignored for adult proposals.
  signerRole?: "player" | "parent";
};

export async function submitResponse(input: Input) {
  const { token, responseType, message, signedName, parentSignedName } = input;

  if (!STATUS_FROM_RESPONSE[responseType]) {
    return { ok: false, error: "Unknown response type." };
  }

  const trimmedMessage = message.trim();
  const trimmedSigned = signedName.trim();
  const trimmedParent = parentSignedName.trim();

  if (responseType !== "approve" && trimmedMessage.length === 0) {
    return {
      ok: false,
      error: "Please add a short note so Cooper Cricket understands what's needed.",
    };
  }

  const supabase = await createClient();

  const { data: proposal, error: fetchErr } = await supabase
    .from("proposals")
    .select(
      "id, status, deal_duration, signed_under_18, player_name, player_email, reference, player_signed_name, player_signed_at, parent_signed_name, parent_signed_at",
    )
    .eq("public_token", token)
    .single();
  if (fetchErr || !proposal) {
    return { ok: false, error: "We couldn't find this proposal." };
  }
  if (proposal.status === "approved" || proposal.status === "declined") {
    return {
      ok: false,
      error:
        "This proposal has already been finalised. Contact Cooper Cricket to discuss.",
    };
  }

  // Under-18 status is decided by staff on the proposal — the client can't
  // override it.
  const under18 = proposal.signed_under_18;

  // ----- Decline / request changes (either party, any time before finalised) -----
  if (responseType !== "approve") {
    const { error: insertErr } = await supabase
      .from("proposal_responses")
      .insert({
        proposal_id: proposal.id,
        response_type: responseType,
        message: trimmedMessage,
        signed_name: null,
        parent_signed_name: null,
        under_18: under18,
      });
    if (insertErr) return { ok: false, error: insertErr.message };

    const { error: updateErr } = await supabase
      .from("proposals")
      .update({ status: STATUS_FROM_RESPONSE[responseType] })
      .eq("id", proposal.id);
    if (updateErr) return { ok: false, error: updateErr.message };

    await notifyStaff({
      playerName: proposal.player_name,
      reference: proposal.reference,
      event: responseType === "decline" ? "declined the proposal" : "requested changes",
      message: trimmedMessage,
    });

    revalidatePath(`/p/${token}`);
    return { ok: true };
  }

  // ----- Approve / sign -----
  const role: "player" | "parent" =
    under18 && input.signerRole === "parent" ? "parent" : "player";

  // The name typed by whoever is signing right now.
  const thisName = role === "parent" ? trimmedParent : trimmedSigned;
  if (thisName.length < 2) {
    return { ok: false, error: "Please type the full legal name to sign." };
  }

  // Block the same party signing twice.
  if (under18) {
    if (role === "player" && proposal.player_signed_at) {
      return { ok: false, error: "The player has already signed this proposal." };
    }
    if (role === "parent" && proposal.parent_signed_at) {
      return {
        ok: false,
        error: "The parent or guardian has already signed this proposal.",
      };
    }
  }

  const nowIso = new Date().toISOString();

  // State after applying this signature.
  const playerName = role === "player" ? thisName : proposal.player_signed_name ?? null;
  const playerAt = role === "player" ? nowIso : proposal.player_signed_at ?? null;
  const parentName = role === "parent" ? thisName : proposal.parent_signed_name ?? null;
  const parentAt = role === "parent" ? nowIso : proposal.parent_signed_at ?? null;

  // Adult: finalises on the player's signature.
  // Under-18: finalises only once BOTH player and parent have signed.
  const fullySigned = under18 ? !!playerAt && !!parentAt : true;

  // Audit row for this individual signature.
  const { error: insertErr } = await supabase
    .from("proposal_responses")
    .insert({
      proposal_id: proposal.id,
      response_type: "approve",
      message: trimmedMessage,
      signed_name: role === "player" ? thisName : null,
      parent_signed_name: role === "parent" ? thisName : null,
      under_18: under18,
    });
  if (insertErr) return { ok: false, error: insertErr.message };

  const update: TablesUpdate<"proposals"> = {
    player_signed_name: playerName,
    player_signed_at: playerAt,
    parent_signed_name: parentName,
    parent_signed_at: parentAt,
    signed_under_18: under18,
  };

  if (fullySigned) {
    const years = parseYearsFromDuration(proposal.deal_duration);
    update.status = "approved";
    update.signed_name = under18 ? playerName : thisName;
    update.signed_at = nowIso;
    update.expires_at = addYearsIso(nowIso, years);
  } else {
    update.status = "partially_signed";
  }

  const { error: updateErr } = await supabase
    .from("proposals")
    .update(update)
    .eq("id", proposal.id);
  if (updateErr) return { ok: false, error: updateErr.message };

  await notifyStaff({
    playerName: proposal.player_name,
    reference: proposal.reference,
    event: fullySigned
      ? "signed and approved the proposal"
      : `signed (${role === "parent" ? "parent/guardian" : "player"}), awaiting co-signature`,
  });

  // When it's fully signed, confirm to the player too.
  if (fullySigned) {
    await notifyPlayerSigned({
      to: proposal.player_email,
      playerName: proposal.player_name,
      reference: proposal.reference,
    });
  }

  revalidatePath(`/p/${token}`);
  return { ok: true };
}
