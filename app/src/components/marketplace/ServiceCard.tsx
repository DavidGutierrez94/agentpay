"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ServiceListing } from "@/lib/hooks/useServices";
import { AddressDisplay } from "../shared/AddressDisplay";

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
      className="group flex flex-col border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:border-[var(--color-border-bright)] hover:shadow-[var(--card-shadow)]"
    >
      {/* Card Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" />
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)] opacity-50" />
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)] opacity-25" />
          </div>
          <span className="text-[var(--color-primary)] text-[10px] uppercase tracking-wider">
            SERVICE
          </span>
        </div>
        <span
          className={`text-[10px] uppercase ${service.isActive ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"}`}
        >
          [{service.isActive ? "ACTIVE" : "INACTIVE"}]
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Description */}
        <div className="text-[var(--color-text)] text-sm font-mono leading-relaxed">
          {service.description}
        </div>

        {/* Provider Info */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-[var(--color-text-dim)]">provider:</span>
          <AddressDisplay address={service.provider} chars={4} />
        </div>

        {/* Stats Row */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--color-text-dim)]">tasks:</span>
            <span className="text-[var(--color-accent)] font-mono">{service.tasksCompleted}</span>
          </div>
          {service.minReputation > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-dim)]">min_rep:</span>
              <span className="text-[var(--color-warning)] font-mono">{service.minReputation}</span>
            </div>
          )}
        </div>

        {/* Price & Badges */}
        <div className="mt-4 flex items-center gap-3">
          {/* Escrow Price */}
          <div className="border border-[var(--color-secondary)]/50 bg-[var(--color-secondary)]/10 px-3 py-1">
            <span className="text-[var(--color-secondary)] text-xs font-mono">
              {service.priceSol} SOL
            </span>
          </div>

          {/* x402 Price */}
          {x402Config && (
            <div className="border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 px-3 py-1">
              <span className="text-[var(--color-accent)] text-xs font-mono">
                ${x402Config.priceUsdc} x402
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onHire(service)}
            className="flex-1 border border-[var(--color-primary)] py-2 text-xs text-[var(--color-primary)] uppercase tracking-wider transition-all hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] hover:shadow-[var(--glow-primary)]"
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
              className="flex-1 border border-[var(--color-accent)] py-2 text-xs text-[var(--color-accent)] uppercase tracking-wider transition-all hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] hover:shadow-[var(--card-shadow)] disabled:opacity-50"
            >
              {x402Loading ? "PROCESSING..." : "&gt; PAY_x402"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
