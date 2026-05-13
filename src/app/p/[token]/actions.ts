"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TablesUpdate } from "@/lib/supabase/types";

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
  under18: boolean;
};

export async function submitResponse(input: Input) {
  const { token, responseType, message, signedName, parentSignedName, under18 } =
    input;

  if (!STATUS_FROM_RESPONSE[responseType]) {
    return { ok: false, error: "Unknown response type." };
  }

  const trimmedMessage = message.trim();
  const trimmedSigned = signedName.trim();
  const trimmedParent = parentSignedName.trim();

  if (responseType === "approve") {
    if (trimmedSigned.length < 2) {
      return { ok: false, error: "Please type your full legal name to sign." };
    }
    if (under18 && trimmedParent.length < 2) {
      return {
        ok: false,
        error: "A parent or guardian must also type their full name.",
      };
    }
  } else if (trimmedMessage.length === 0) {
    return {
      ok: false,
      error: "Please add a short note so Cooper Cricket understands what's needed.",
    };
  }

  const supabase = await createClient();

  const { data: proposal, error: fetchErr } = await supabase
    .from("proposals")
    .select("id, status")
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

  const { error: insertErr } = await supabase.from("proposal_responses").insert({
    proposal_id: proposal.id,
    response_type: responseType,
    message: trimmedMessage,
    signed_name: responseType === "approve" ? trimmedSigned : null,
    parent_signed_name:
      responseType === "approve" && under18 ? trimmedParent : null,
    under_18: under18,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  const update: TablesUpdate<"proposals"> = {
    status: STATUS_FROM_RESPONSE[responseType],
  };
  if (responseType === "approve") {
    update.signed_name = trimmedSigned;
    update.parent_signed_name = under18 ? trimmedParent : null;
    update.signed_under_18 = under18;
    update.signed_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from("proposals")
    .update(update)
    .eq("id", proposal.id);
  if (updateErr) return { ok: false, error: updateErr.message };

  revalidatePath(`/p/${token}`);
  return { ok: true };
}
