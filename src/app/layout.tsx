import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import AppHeader from "@/components/app-header";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cooper Cricket Sponsorship Proposal",
  description:
    "Submit a new professional player sponsorship proposal. Fill in player details, social reach, and equipment needs for review and sign-off",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="min-h-screen bg-background">
        <Providers>
          <AppHeader />
          <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
