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
      className={`inline-flex items-center gap-1 font-mono text-xs text-zinc-400 transition-colors hover:text-white ${className}`}
      title={address}
    >
      {shortenAddress(address, chars)}
      <span className="text-[10px]">{copied ? "Copied!" : ""}</span>
    </button>
  );
}
