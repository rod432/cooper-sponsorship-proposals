import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/app-header";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  return (
    <>
      <AppHeader userEmail={email} />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </>
  );
}
