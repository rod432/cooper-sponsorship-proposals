"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TablesUpdate } from "@/lib/supabase/types";
import { addYearsIso, parseYearsFromDuration } from "@/lib/expiry";

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
      "id, status, deal_duration, signed_under_18, player_signed_name, player_signed_at, parent_signed_name, parent_signed_at",
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

  revalidatePath(`/p/${token}`);
  return { ok: true };
}
