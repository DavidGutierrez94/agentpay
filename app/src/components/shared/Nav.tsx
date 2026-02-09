"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WalletButton } from "./WalletButton";

const links = [
  { href: "/", label: "home", path: "~" },
  { href: "/marketplace", label: "marketplace", path: "~/mkt" },
  { href: "/agents", label: "agents", path: "~/agents" },
  { href: "/teams", label: "teams", path: "~/teams" },
  { href: "/org", label: "org", path: "~/org" },
  { href: "/board", label: "board", path: "~/board" },
  { href: "/terminal", label: "terminal", path: "~/term" },
  { href: "/admin", label: "admin", path: "~/admin" },
];

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get current path for display
  const currentLink = links.find((l) => l.href === pathname);
  const currentPath = currentLink?.path || "~";

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-[#00ff41]/25 bg-[#0a0a0a]/95 backdrop-blur-sm font-mono">
      {/* Terminal Title Bar */}
      <div className="border-b border-[#00ff41]/25 bg-[#111111] px-4 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Terminal dots */}
            <div className="hidden sm:flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff3333]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffcc00]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#00ff41]" />
            </div>
            <Link
              href="/"
              className="text-[#00ff41] text-sm font-bold tracking-wider glitch-hover"
            >
              AGENTPAY_TERMINAL <span className="text-[#666666]">v2.0</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-[#666666] text-xs">
              {currentPath}
            </span>
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center -mb-px">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 text-xs uppercase tracking-wider transition-colors",
                    isActive
                      ? "text-[#00ff41] bg-[#111111]"
                      : "text-[#666666] hover:text-[#00ff41]"
                  )}
                >
                  {isActive && (
                    <>
                      {/* Active indicator */}
                      <span className="absolute left-0 top-0 bottom-0 w-px bg-[#00ff41]" />
                      <span className="absolute right-0 top-0 bottom-0 w-px bg-[#00ff41]" />
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-[#00ff41]" />
                    </>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#00ff41]/50">&gt;</span>
                    {link.label}
                    {isActive && <span className="animate-pulse">_</span>}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center text-[#00ff41] md:hidden"
            aria-label="Toggle menu"
          >
            <span className="text-lg">{mobileOpen ? "[×]" : "[≡]"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#00ff41]/25 bg-[#111111] md:hidden">
          <div className="px-2 py-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-[#00ff41] bg-[#1a1a1a]"
                      : "text-[#666666] hover:text-[#00ff41]"
                  )}
                >
                  <span className="text-[#00ff41]/50">&gt;</span>
                  <span className="uppercase tracking-wider">{link.label}</span>
                  <span className="ml-auto text-[#444444] text-xs">
                    {link.path}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Terminal prompt at bottom */}
          <div className="border-t border-[#00ff41]/25 px-4 py-2 text-xs text-[#666666]">
            <span className="text-[#00ff41]">guest@agentpay</span>
            <span>:</span>
            <span className="text-[#00d4ff]">{currentPath}</span>
            <span>$ </span>
            <span className="animate-pulse text-[#00ff41]">█</span>
          </div>
        </div>
      )}
    </nav>
  );
}
