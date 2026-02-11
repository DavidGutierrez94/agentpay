"use client";

interface X402BadgeProps {
  priceUsdc: number;
  className?: string;
}

export function X402Badge({ priceUsdc, className = "" }: X402BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/20 ${className}`}
    >
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>x402</span>
      <span className="opacity-80">${priceUsdc.toFixed(4)}</span>
    </span>
  );
}
