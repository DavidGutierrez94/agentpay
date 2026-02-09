"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CommandResult } from "./CommandRegistry";
import { AddressDisplay } from "../shared/AddressDisplay";
import { EscrowBadge } from "../shared/EscrowBadge";
import { StatusBadge } from "../shared/StatusBadge";

export function VisualPanel({ result }: { result: CommandResult | null }) {
  if (!result || !result.data) {
    return (
      <div
        className="flex h-full items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <div className="text-center text-[var(--color-muted)]">
          <p className="text-lg font-medium text-[var(--color-text)]">[OUTPUT_PANEL]</p>
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
      <div
        className="h-full overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" />
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" style={{ opacity: 0.5 }} />
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" style={{ opacity: 0.25 }} />
          </div>
          <span className="text-[var(--color-primary)] text-[10px] uppercase tracking-wider">
            SERVICES ({(data.services as unknown[]).length})
          </span>
        </div>
        <AnimatePresence>
          {(data.services as Record<string, unknown>[]).map(
            (s: Record<string, unknown>, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mb-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                <p className="text-sm text-[var(--color-text)]">
                  {s.description as string}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <EscrowBadge sol={s.priceSol as string} />
                  <AddressDisplay address={s.provider as string} chars={4} />
                  <span className="text-xs text-[var(--color-muted)]">
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
      <div
        className="h-full overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-[var(--color-accent)]" />
            <div className="h-1.5 w-1.5 bg-[var(--color-accent)]" style={{ opacity: 0.5 }} />
            <div className="h-1.5 w-1.5 bg-[var(--color-accent)]" style={{ opacity: 0.25 }} />
          </div>
          <span className="text-[var(--color-accent)] text-[10px] uppercase tracking-wider">
            TASKS ({(data.tasks as unknown[]).length})
          </span>
        </div>
        <AnimatePresence>
          {(data.tasks as Record<string, unknown>[]).map(
            (t: Record<string, unknown>, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="mb-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status as "open"} />
                  <EscrowBadge sol={t.amountSol as string} />
                </div>
                <p className="mt-1 text-sm text-[var(--color-text)]">
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
    <div
      className="flex h-full items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
        style={{ borderRadius: "var(--border-radius-sm)" }}
      >
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-0"
          >
            <span className="text-xs text-[var(--color-muted)] uppercase">{key}</span>
            <span className="text-sm text-[var(--color-text)] font-mono max-w-[200px] truncate">
              {String(value)}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
