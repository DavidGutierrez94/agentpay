"use client";

export function ZKBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]"
      style={{ borderRadius: "var(--border-radius-sm)" }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="animate-pulse">
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3 5 L4.5 6.5 L7 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      ZK Verified
    </span>
  );
}
