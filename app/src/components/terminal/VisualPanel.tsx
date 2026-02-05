"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CommandResult } from "./CommandRegistry";
import { AddressDisplay } from "../shared/AddressDisplay";
import { EscrowBadge } from "../shared/EscrowBadge";
import { StatusBadge } from "../shared/StatusBadge";

export function VisualPanel({ result }: { result: CommandResult | null }) {
  if (!result || !result.data) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 p-8">
        <div className="text-center text-zinc-600">
          <p className="text-lg font-medium">Output Panel</p>
          <p className="mt-1 text-sm">
            Run a command to see visual output here
          </p>
        </div>
      </div>
    );
  }

  const data = result.data as Record<string, unknown>;

  // Services list
  if (data.services && Array.isArray(data.services)) {
    return (
      <div className="h-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">
          Services ({(data.services as unknown[]).length})
        </h3>
        <AnimatePresence>
          {(data.services as Record<string, unknown>[]).map(
            (s: Record<string, unknown>, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mb-2 rounded-lg border border-zinc-800 p-3"
              >
                <p className="text-sm text-white">
                  {s.description as string}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <EscrowBadge sol={s.priceSol as string} />
                  <AddressDisplay address={s.provider as string} chars={4} />
                  <span className="text-xs text-zinc-500">
                    {s.tasksCompleted as number} done
                  </span>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Tasks list
  if (data.tasks && Array.isArray(data.tasks)) {
    return (
      <div className="h-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">
          Tasks ({(data.tasks as unknown[]).length})
        </h3>
        <AnimatePresence>
          {(data.tasks as Record<string, unknown>[]).map(
            (t: Record<string, unknown>, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mb-2 rounded-lg border border-zinc-800 p-3"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status as "open"} />
                  <EscrowBadge sol={t.amountSol as string} />
                </div>
                <p className="mt-1 text-sm text-zinc-300">
                  {t.description as string}
                </p>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Single result (balance, wallet-info, tx confirmation)
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-lg border border-zinc-800 p-4"
      >
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-zinc-800/50 py-2 last:border-0"
          >
            <span className="text-xs text-zinc-500">{key}</span>
            <span className="text-sm text-zinc-300 font-mono max-w-[200px] truncate">
              {String(value)}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
