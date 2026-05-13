"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isCreatePage = pathname === "/";

  const handleSave = () => {
    window.__proposalActions?.save?.();
  };

  const handleEmail = () => {
    window.__proposalActions?.email?.();
  };

  const handlePdf = () => {
    window.__proposalActions?.printPdf?.();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary-dark to-primary shadow-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
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
          <span className="font-heading text-lg font-semibold text-primary-foreground">
            Cooper Cricket
          </span>
        </div>

        <nav className="flex items-center gap-1">
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

        <div className="flex items-center gap-2">
          {isCreatePage ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handlePdf}
              >
                <FileText className="mr-1.5 h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handleEmail}
              >
                <Mail className="mr-1.5 h-4 w-4" />
                Send
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={handleSave}
              >
                <Save className="mr-1.5 h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <div className="w-[180px]" />
          )}
        </div>
      </div>
    </header>
  );
}
