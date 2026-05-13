import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary-dark to-primary shadow-md print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
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
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </>
  );
}
