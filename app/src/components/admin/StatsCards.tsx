"use client";

import { motion } from "framer-motion";
import type { ProtocolStats } from "@/lib/hooks/useProtocolStats";

export function StatsCards({ stats }: { stats: ProtocolStats | undefined }) {
  const cards = [
    {
      label: "TOTAL_SERVICES",
      value: stats?.activeServices ?? "—",
      colorClass: "text-[var(--color-accent)]",
    },
    {
      label: "ACTIVE_TASKS",
      value: stats
        ? (stats.tasksByStatus.open ?? 0) +
          (stats.tasksByStatus.submitted ?? 0)
        : "—",
      colorClass: "text-[#ffcc00]",
    },
    {
      label: "COMPLETED",
      value: stats?.tasksByStatus.completed ?? "—",
      colorClass: "text-[var(--color-primary)]",
    },
    {
      label: "ESCROW_LOCKED",
      value: stats ? `${stats.escrowLockedSol} SOL` : "—",
      colorClass: "text-[var(--color-secondary)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums font-mono ${card.colorClass}`}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
