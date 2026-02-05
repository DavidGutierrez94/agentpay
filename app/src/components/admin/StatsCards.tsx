"use client";

import { motion } from "framer-motion";
import type { ProtocolStats } from "@/lib/hooks/useProtocolStats";

export function StatsCards({ stats }: { stats: ProtocolStats | undefined }) {
  const cards = [
    {
      label: "Total Services",
      value: stats?.activeServices ?? "—",
      color: "text-blue-400",
    },
    {
      label: "Active Tasks",
      value: stats
        ? (stats.tasksByStatus.open ?? 0) +
          (stats.tasksByStatus.submitted ?? 0)
        : "—",
      color: "text-orange-400",
    },
    {
      label: "Completed",
      value: stats?.tasksByStatus.completed ?? "—",
      color: "text-emerald-400",
    },
    {
      label: "Escrow Locked",
      value: stats ? `${stats.escrowLockedSol} SOL` : "—",
      color: "text-violet-400",
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
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
        >
          <p className="text-sm text-zinc-500">{card.label}</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${card.color}`}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
