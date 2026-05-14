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
};

export async function submitResponse(input: Input) {
  const { token, responseType, message, signedName, parentSignedName } = input;

  if (!STATUS_FROM_RESPONSE[responseType]) {
    return { ok: false, error: "Unknown response type." };
  }

  const trimmedMessage = message.trim();
  const trimmedSigned = signedName.trim();
  const trimmedParent = parentSignedName.trim();

  if (responseType === "approve" && trimmedSigned.length < 2) {
    return { ok: false, error: "Please type your full legal name to sign." };
  }
  if (responseType !== "approve" && trimmedMessage.length === 0) {
    return {
      ok: false,
      error: "Please add a short note so Cooper Cricket understands what's needed.",
    };
  }

  const supabase = await createClient();

  const { data: proposal, error: fetchErr } = await supabase
    .from("proposals")
    .select("id, status, deal_duration, signed_under_18")
    .eq("public_token", token)
    .single();
  if (fetchErr || !proposal) {
    return { ok: false, error: "We couldn't find this proposal." };
  }
  if (proposal.status === "approved" || proposal.status === "declined") {
    return {
      ok: false,
      error: "This proposal has already been finalised. Contact Cooper Cricket to discuss.",
    };
  }

  // Under-18 status is decided by staff on the proposal — the player has no
  // say. Override whatever the client posted with the canonical value from
  // the proposal row, so the player can't sign as an adult on an under-18
  // proposal (or vice versa).
  const effectiveUnder18 = proposal.signed_under_18;

  if (responseType === "approve" && effectiveUnder18 && trimmedParent.length < 2) {
    return {
      ok: false,
      error:
        "This proposal requires a parent or guardian signature. Please type the parent/guardian's full name.",
    };
  }

  const { error: insertErr } = await supabase.from("proposal_responses").insert({
    proposal_id: proposal.id,
    response_type: responseType,
    message: trimmedMessage,
    signed_name: responseType === "approve" ? trimmedSigned : null,
    parent_signed_name:
      responseType === "approve" && effectiveUnder18 ? trimmedParent : null,
    under_18: effectiveUnder18,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  const update: TablesUpdate<"proposals"> = {
    status: STATUS_FROM_RESPONSE[responseType],
  };
  if (responseType === "approve") {
    const signedAtIso = new Date().toISOString();
    const years = parseYearsFromDuration(proposal.deal_duration);
    update.signed_name = trimmedSigned;
    update.parent_signed_name = effectiveUnder18 ? trimmedParent : null;
    update.signed_under_18 = effectiveUnder18;
    update.signed_at = signedAtIso;
    update.expires_at = addYearsIso(signedAtIso, years);
  }

  const { error: updateErr } = await supabase
    .from("proposals")
    .update(update)
    .eq("id", proposal.id);
  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath(`/p/${token}`);
  return { ok: true };
}
