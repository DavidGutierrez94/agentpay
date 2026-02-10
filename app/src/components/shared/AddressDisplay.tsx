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
      className={`inline-flex items-center gap-1.5 font-mono text-xs text-[#00d4ff] transition-colors hover:text-[#00ff41] ${className}`}
      title={address}
    >
      <span className="text-[#666666]">[</span>
      {shortenAddress(address, chars)}
      <span className="text-[#666666]">]</span>
      {copied && <span className="text-[10px] text-[#00ff41] animate-pulse">COPIED</span>}
    </button>
  );
}
