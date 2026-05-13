"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { FileText, LogOut, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut } from "@/app/login/actions";

const navItems = [
  { label: "Create", path: "/" },
  { label: "Proposals", path: "/proposals" },
  { label: "Catalog", path: "/catalog" },
  { label: "Terms", path: "/terms" },
];

type ProposalActions = {
  save?: () => void;
  email?: () => void;
  printPdf?: () => void;
  isSaving?: boolean;
};

declare global {
  interface Window {
    __proposalActions?: ProposalActions;
  }
}

type Props = {
  userEmail: string | null;
};

export default function AppHeader({ userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const isCreatePage = pathname === "/";
  const [isPending, startTransition] = useTransition();

  const initial = userEmail ? userEmail[0].toUpperCase() : "?";

  const handleSave = () => window.__proposalActions?.save?.();
  const handleEmail = () => window.__proposalActions?.email?.();
  const handlePdf = () => window.__proposalActions?.printPdf?.();

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary-dark to-primary shadow-md print:hidden">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20 p-1">
            <Image
              src="/cooper-c-logo.png"
              alt="Cooper Cricket"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="hidden font-heading text-lg font-semibold text-primary-foreground sm:inline">
            Cooper Cricket
          </span>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`rounded-lg px-3 py-1.5 font-heading text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {isCreatePage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handlePdf}
                title="Open Print PDF tab"
              >
                <FileText className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handleEmail}
                title="Send to player"
              >
                <Mail className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Send</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handleSave}
                title="Save proposal"
              >
                <Save className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            </>
          )}

          {userEmail && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 font-heading text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/30"
                  aria-label="Account menu"
                >
                  {initial}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Signed in as
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {userEmail}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isPending}
                    onClick={() => startTransition(() => signOut())}
                  >
                    <LogOut className="mr-1.5 h-4 w-4" />
                    {isPending ? "Signing out…" : "Sign out"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}
