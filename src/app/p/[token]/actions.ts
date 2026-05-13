"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const STATUS_FROM_RESPONSE: Record<string, string> = {
  approve: "approved",
  decline: "declined",
  request_changes: "changes_requested",
};

export async function submitResponse(
  token: string,
  responseType: "approve" | "decline" | "request_changes",
  message: string,
) {
  if (!STATUS_FROM_RESPONSE[responseType]) {
    return { ok: false, error: "Unknown response type." };
  }
  const trimmed = message.trim();
  if (responseType !== "approve" && trimmed.length === 0) {
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
    message: trimmed,
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
