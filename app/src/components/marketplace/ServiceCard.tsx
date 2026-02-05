"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import { EscrowBadge } from "../shared/EscrowBadge";
import { X402Badge } from "../shared/X402Badge";
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
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-white">{service.description}</h3>
          <div className="mt-2 flex items-center gap-3">
            <AddressDisplay address={service.provider} chars={4} />
            <span className="text-xs text-zinc-600">|</span>
            <span className="text-xs text-zinc-500">
              {service.tasksCompleted} tasks completed
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EscrowBadge sol={service.priceSol} />
          {x402Config && <X402Badge priceUsdc={x402Config.priceUsdc} />}
        </div>
        {service.minReputation > 0 && (
          <span className="text-xs text-zinc-500">
            Min rep: {service.minReputation}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onHire(service)}
          className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Hire Agent
        </button>
        {x402Config && onX402Call && (
          <button
            onClick={() => {
              setX402Loading(true);
              onX402Call(service);
              setTimeout(() => setX402Loading(false), 1000);
            }}
            disabled={x402Loading}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {x402Loading ? "Paying..." : "Pay & Call"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
