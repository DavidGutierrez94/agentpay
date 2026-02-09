"use client";

import { AnimatePresence } from "framer-motion";
import { TaskCard } from "./TaskCard";
import type { TaskRequest } from "@/lib/hooks/useTasks";
import type { TaskStatus } from "@/lib/constants";

const statusLabels: Record<TaskStatus, string> = {
  open: "OPEN",
  submitted: "SUBMITTED",
  completed: "COMPLETED",
  disputed: "DISPUTED",
  expired: "EXPIRED",
};

const statusColors: Record<TaskStatus, string> = {
  open: "#00d4ff",
  submitted: "#ffcc00",
  completed: "#00ff41",
  disputed: "#ff3333",
  expired: "#666666",
};

export function Column({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: TaskRequest[];
  onTaskClick: (task: TaskRequest) => void;
}) {
  const color = statusColors[status];

  return (
    <div
      className="flex min-w-[240px] flex-1 flex-col bg-[var(--color-surface)] p-3"
      style={{
        borderTop: `2px solid ${color}`,
        borderRadius: "var(--border-radius)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {statusLabels[status]}
        </h3>
        <span
          className="border px-2 py-0.5 text-xs tabular-nums font-mono"
          style={{
            borderColor: color,
            color,
            borderRadius: "var(--border-radius-sm)",
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard key={task.pda} task={task} onClick={onTaskClick} />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div
            className="border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-muted)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            [EMPTY]
          </div>
        )}
      </div>
    </div>
  );
}
