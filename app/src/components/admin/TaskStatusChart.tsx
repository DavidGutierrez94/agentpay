"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ProtocolStats } from "@/lib/hooks/useProtocolStats";

const STATUS_COLORS: Record<string, string> = {
  open: "#00d4ff",
  submitted: "#ffcc00",
  completed: "#00ff41",
  disputed: "#ff3333",
  expired: "#666666",
};

export function TaskStatusChart({ stats }: { stats: ProtocolStats | undefined }) {
  if (!stats) return null;

  const data = Object.entries(stats.tasksByStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.toUpperCase(),
      value: count,
      fill: STATUS_COLORS[status] ?? "#666666",
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
        [NO_TASKS]
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              borderRadius: "var(--border-radius-sm)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-family)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5"
              style={{ backgroundColor: d.fill, borderRadius: "var(--border-radius-sm)" }}
            />
            <span className="text-xs text-[var(--color-muted)] font-mono">
              {d.name} ({d.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
