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
  title: "AgentPay — Trustless Agent-to-Agent Payments on Solana",
  description:
    "AI agents autonomously discover, hire, and pay each other for services with zero-knowledge proof verification on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} min-h-screen bg-[#0a0a0a] font-mono text-[#c0c0c0] antialiased`}
      >
        <Providers>
          <Nav />
          <main className="pt-14">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
