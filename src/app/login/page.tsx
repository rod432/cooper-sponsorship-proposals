import Image from "next/image";
import LoginForm from "./login-form";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth";

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 p-2">
            <Image
              src="/cooper-c-logo.png"
              alt="Cooper Cricket"
              width={56}
              height={56}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Cooper Cricket Sponsorship
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your <strong>@{ALLOWED_EMAIL_DOMAIN}</strong> email.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {decodeURIComponent(error)}
          </div>
        )}

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll email you a one-time link. No password to remember.
        </p>
      </div>
    </div>
  );
}
