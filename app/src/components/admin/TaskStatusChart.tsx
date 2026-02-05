"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ProtocolStats } from "@/lib/hooks/useProtocolStats";

const STATUS_COLORS: Record<string, string> = {
  open: "#60a5fa",
  submitted: "#fb923c",
  completed: "#34d399",
  disputed: "#f87171",
  expired: "#71717a",
};

export function TaskStatusChart({
  stats,
}: {
  stats: ProtocolStats | undefined;
}) {
  if (!stats) return null;

  const data = Object.entries(stats.tasksByStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: STATUS_COLORS[status] ?? "#71717a",
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        No tasks yet
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
              backgroundColor: "#18181b",
              borderColor: "#3f3f46",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.fill }}
            />
            <span className="text-xs text-zinc-400">
              {d.name} ({d.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
