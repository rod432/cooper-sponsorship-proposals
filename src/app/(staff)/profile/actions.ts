"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 1) {
    return { ok: false, error: "Please enter your full name." };
  }

  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, error: "Not signed in." };
  }
  const user = userData.user;

  // Mirror to auth.users.user_metadata so it's available on other clients.
  const { error: authErr } = await supabase.auth.updateUser({
    data: { full_name: fullName, role, phone },
  });
  if (authErr) return { ok: false, error: authErr.message };

  // Source of truth: staff_profiles row (queryable for the picker).
  const { error: profileErr } = await supabase
    .from("staff_profiles")
    .upsert({
      user_id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      role,
      phone,
    });
  if (profileErr) return { ok: false, error: profileErr.message };

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}
