"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import type { ServiceListing } from "@/lib/hooks/useServices";

interface X402Config {
  priceUsdc: number;
  endpoint: string;
}

export function ServiceCard({
  service,
  onHire,
  x402Config,
  onX402Call,
}: {
  service: ServiceListing;
  onHire: (service: ServiceListing) => void;
  x402Config?: X402Config;
  onX402Call?: (service: ServiceListing) => void;
}) {
  const [x402Loading, setX402Loading] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col border border-[#00ff41]/25 bg-[#111111] transition-all hover:border-[#00ff41] hover:shadow-[0_0_20px_rgba(0,255,65,0.1)]"
    >
      {/* Card Header */}
      <div className="border-b border-[#00ff41]/25 bg-[#1a1a1a] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-[#00ff41]" />
            <div className="h-1.5 w-1.5 bg-[#00ff41]/50" />
            <div className="h-1.5 w-1.5 bg-[#00ff41]/25" />
          </div>
          <span className="text-[#00ff41] text-[10px] uppercase tracking-wider">
            SERVICE
          </span>
        </div>
        <span className={`text-[10px] uppercase ${service.isActive ? "text-[#00ff41]" : "text-[#ff3333]"}`}>
          [{service.isActive ? "ACTIVE" : "INACTIVE"}]
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Description */}
        <div className="text-[#c0c0c0] text-sm font-mono leading-relaxed">
          {service.description}
        </div>

        {/* Provider Info */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-[#666666]">provider:</span>
          <AddressDisplay address={service.provider} chars={4} />
        </div>

        {/* Stats Row */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#666666]">tasks:</span>
            <span className="text-[#00d4ff] font-mono">{service.tasksCompleted}</span>
          </div>
          {service.minReputation > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#666666]">min_rep:</span>
              <span className="text-[#ffcc00] font-mono">{service.minReputation}</span>
            </div>
          )}
        </div>

        {/* Price & Badges */}
        <div className="mt-4 flex items-center gap-3">
          {/* Escrow Price */}
          <div className="border border-[#ff0080]/50 bg-[#ff0080]/10 px-3 py-1">
            <span className="text-[#ff0080] text-xs font-mono">
              {service.priceSol} SOL
            </span>
          </div>

          {/* x402 Price */}
          {x402Config && (
            <div className="border border-[#00d4ff]/50 bg-[#00d4ff]/10 px-3 py-1">
              <span className="text-[#00d4ff] text-xs font-mono">
                ${x402Config.priceUsdc} x402
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onHire(service)}
            className="flex-1 border border-[#00ff41] py-2 text-xs text-[#00ff41] uppercase tracking-wider transition-all hover:bg-[#00ff41] hover:text-[#0a0a0a] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]"
          >
            &gt; HIRE_AGENT
          </button>
          {x402Config && onX402Call && (
            <button
              onClick={() => {
                setX402Loading(true);
                onX402Call(service);
                setTimeout(() => setX402Loading(false), 1000);
              }}
              disabled={x402Loading}
              className="flex-1 border border-[#00d4ff] py-2 text-xs text-[#00d4ff] uppercase tracking-wider transition-all hover:bg-[#00d4ff] hover:text-[#0a0a0a] hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] disabled:opacity-50"
            >
              {x402Loading ? "PROCESSING..." : "&gt; PAY_x402"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
