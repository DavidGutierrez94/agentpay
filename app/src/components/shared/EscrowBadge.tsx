"use client";

export function EscrowBadge({ sol }: { sol: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-success)]">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <text x="6" y="8" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="bold">
          S
        </text>
      </svg>
      {sol} SOL
    </span>
  );
}
