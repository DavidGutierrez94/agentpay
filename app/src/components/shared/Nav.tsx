"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/lib/theme-context";
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
  const { theme, setTheme, themes } = useTheme();

  // Get current path for display
  const currentLink = links.find((l) => l.href === pathname);
  const currentPath = currentLink?.path || "~";

  return (
    <nav
      className="fixed top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm"
      style={{ fontFamily: "var(--font-family)" }}
    >
      {/* Terminal Title Bar */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Terminal dots */}
            <div className="hidden sm:flex gap-1.5">
              <div
                className="h-2.5 w-2.5 bg-[var(--color-error)]"
                style={{ borderRadius: "var(--border-radius)" }}
              />
              <div
                className="h-2.5 w-2.5 bg-[var(--color-warning)]"
                style={{ borderRadius: "var(--border-radius)" }}
              />
              <div
                className="h-2.5 w-2.5 bg-[var(--color-success)]"
                style={{ borderRadius: "var(--border-radius)" }}
              />
            </div>
            <Link
              href="/"
              className="text-[var(--color-primary)] text-sm font-bold tracking-wider glitch-hover"
            >
              AGENTPAY <span className="text-[var(--color-text-dim)]">v2.0</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as typeof theme)}
              className="theme-switcher hidden sm:block"
              title="Switch theme"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="hidden md:block text-[var(--color-text-dim)] text-xs">
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
                      ? "text-[var(--color-primary)] bg-[var(--color-surface)]"
                      : "text-[var(--color-text-dim)] hover:text-[var(--color-primary)]",
                  )}
                >
                  {isActive && (
                    <>
                      {/* Active indicator */}
                      <span className="absolute left-0 top-0 bottom-0 w-px bg-[var(--color-primary)]" />
                      <span className="absolute right-0 top-0 bottom-0 w-px bg-[var(--color-primary)]" />
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-[var(--color-primary)]" />
                    </>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="text-[var(--color-primary)]/50">&gt;</span>
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
            className="flex h-10 w-10 items-center justify-center text-[var(--color-primary)] md:hidden"
            aria-label="Toggle menu"
          >
            <span className="text-lg">{mobileOpen ? "[×]" : "[≡]"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] md:hidden">
          <div className="px-2 py-2">
            {/* Mobile Theme Switcher */}
            <div className="px-3 py-2 mb-2">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as typeof theme)}
                className="theme-switcher w-full"
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} — {t.description}
                  </option>
                ))}
              </select>
            </div>
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
                      ? "text-[var(--color-primary)] bg-[var(--color-surface-elevated)]"
                      : "text-[var(--color-text-dim)] hover:text-[var(--color-primary)]",
                  )}
                >
                  <span className="text-[var(--color-primary)]/50">&gt;</span>
                  <span className="uppercase tracking-wider">{link.label}</span>
                  <span className="ml-auto text-[var(--color-text-dim)] text-xs">{link.path}</span>
                </Link>
              );
            })}
          </div>
          {/* Terminal prompt at bottom */}
          <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-dim)]">
            <span className="text-[var(--color-primary)]">guest@agentpay</span>
            <span>:</span>
            <span className="text-[var(--color-accent)]">{currentPath}</span>
            <span>$ </span>
            <span className="animate-pulse text-[var(--color-primary)]">█</span>
          </div>
        </div>
      )}
    </nav>
  );
}
