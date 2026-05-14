import Image from "next/image";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-primary-dark to-primary shadow-md print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Image
            src="/cooper-cricket-wordmark-white.svg"
            alt="Cooper Cricket"
            width={140}
            height={42}
            className="h-8 w-auto"
            priority
          />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </>
  );
}
