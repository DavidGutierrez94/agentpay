"use client";

import { useState } from "react";
import { shortenAddress } from "@/lib/utils";

export function AddressDisplay({
  address,
  chars = 4,
  className = "",
}: {
  address: string;
  chars?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-accent)] transition-colors hover:text-[var(--color-primary)] ${className}`}
      title={address}
    >
      <span className="text-[var(--color-text-dim)]">[</span>
      {shortenAddress(address, chars)}
      <span className="text-[var(--color-text-dim)]">]</span>
      {copied && (
        <span className="text-[10px] text-[var(--color-primary)] animate-pulse">COPIED</span>
      )}
    </button>
  );
}
