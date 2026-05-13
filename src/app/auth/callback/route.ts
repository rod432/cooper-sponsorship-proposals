import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail, ALLOWED_EMAIL_DOMAIN } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/";
  const supabase = await createClient();

  let exchangeError: { message: string } | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "magiclink" | "email" | "signup" | "recovery" | "invite",
      token_hash: tokenHash,
    });
    exchangeError = error;
  } else {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Missing authentication code in callback.")}`,
        url,
      ),
    );
  }

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, url),
    );
  }

  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? "";
  if (!email || !isAllowedEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          `Only @${ALLOWED_EMAIL_DOMAIN} accounts can sign in.`,
        )}`,
        url,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, url));
}
