import Image from "next/image";
import LoginForm from "./login-form";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth";
import { COMPANY } from "@/lib/company-info";

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      {/* Brand panel — large logo on Cooper blue, hidden on small screens */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary px-12 py-16 text-primary-foreground lg:col-span-2 lg:flex lg:flex-col">
        {/* Big watermark C in the background */}
        <div className="pointer-events-none absolute -right-20 -top-20 opacity-15">
          <Image
            src="/cooper-c-logo.png"
            alt=""
            width={520}
            height={520}
            className="select-none"
          />
        </div>

        <div className="relative">
          <Image
            src="/cooper-cricket-wordmark-white.svg"
            alt="Cooper Cricket"
            width={260}
            height={78}
            className="h-16 w-auto"
            priority
          />
        </div>

        <div className="relative mt-auto space-y-3">
          <h2 className="font-heading text-3xl font-bold leading-tight">
            Sponsorship<br />proposals,<br />signed online.
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/85">
            Build, send and track player sponsorship proposals in one place.
          </p>
        </div>
      </aside>

      {/* Sign-in panel */}
      <div className="flex flex-col items-center justify-center bg-background px-6 py-12 lg:col-span-3">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <Image
              src="/cooper-cricket-wordmark-blue.svg"
              alt="Cooper Cricket"
              width={220}
              height={66}
              className="mb-6 h-14 w-auto"
              priority
            />
          </div>

          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your <strong className="text-foreground">@{ALLOWED_EMAIL_DOMAIN}</strong>{" "}
              email. We&apos;ll send you a one-time link.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground">
            No password to remember. Link expires in one hour.
          </p>

          <footer className="border-t pt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">{COMPANY.legalName}</strong> · ABN{" "}
              {COMPANY.abn}
            </p>
            <p>
              {COMPANY.phone} · {COMPANY.email}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
