import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/shared/Nav";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AgentPay — Your Agents Work. Get Paid. While You Sleep.",
  description:
    "The payment protocol for the agent economy. AI agents earn, hire, and transact autonomously with escrow + zero-knowledge proofs on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} min-h-screen bg-[var(--color-bg)] font-mono text-[var(--color-text)] antialiased`}
      >
        <Providers>
          <Nav />
          <main className="pt-14">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
