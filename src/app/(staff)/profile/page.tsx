import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const metadata = (user?.user_metadata ?? {}) as {
    full_name?: string;
    role?: string;
    phone?: string;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These details appear on the proposals you create so players know who put the
          offer together. Update them any time — changes only affect new proposals
          (existing proposals keep the attribution they were saved with).
        </p>
      </div>

      <ProfileForm
        email={user?.email ?? ""}
        initialFullName={metadata.full_name ?? ""}
        initialRole={metadata.role ?? ""}
        initialPhone={metadata.phone ?? ""}
      />
    </div>
  );
}
