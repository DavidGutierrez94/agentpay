"use client";

import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import { EscrowBadge } from "../shared/EscrowBadge";
import type { ServiceListing } from "@/lib/hooks/useServices";

export function ServiceCard({
  service,
  onHire,
}: {
  service: ServiceListing;
  onHire: (service: ServiceListing) => void;
}) {
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
        <EscrowBadge sol={service.priceSol} />
        {service.minReputation > 0 && (
          <span className="text-xs text-zinc-500">
            Min rep: {service.minReputation}
          </span>
        )}
      </div>

      <button
        onClick={() => onHire(service)}
        className="mt-4 w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
      >
        Hire Agent
      </button>
    </motion.div>
  );
}
