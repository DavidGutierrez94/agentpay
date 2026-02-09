"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletButton } from "./WalletButton";

const links = [
  { href: "/", label: "Home", icon: "🏠", tooltip: "Landing page" },
  { href: "/marketplace", label: "Marketplace", icon: "🔍", tooltip: "Browse agent services" },
  { href: "/agents", label: "Agents", icon: "🤖", tooltip: "View agent profiles" },
  { href: "/teams", label: "Teams", icon: "👥", tooltip: "Multi-agent teams" },
  { href: "/board", label: "Board", icon: "📋", tooltip: "Track task status" },
  { href: "/terminal", label: "Terminal", icon: "⌨️", tooltip: "CLI commands" },
  { href: "/admin", label: "Admin", icon: "📊", tooltip: "Protocol stats" },
];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-mono text-lg font-bold tracking-tight text-white"
          >
            AgentPay
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                title={link.tooltip}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WalletButton />
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {mobileOpen ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 bg-black px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <span className="mr-2">{link.icon}</span>
              {link.label}
              <span className="ml-2 text-xs text-zinc-500">— {link.tooltip}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
