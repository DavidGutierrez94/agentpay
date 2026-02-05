"use client";

import { AnimatePresence } from "framer-motion";
import { TaskCard } from "./TaskCard";
import { cn, getColumnColor } from "@/lib/utils";
import type { TaskRequest } from "@/lib/hooks/useTasks";
import type { TaskStatus } from "@/lib/constants";

const statusLabels: Record<TaskStatus, string> = {
  open: "Open",
  submitted: "Submitted",
  completed: "Completed",
  disputed: "Disputed",
  expired: "Expired",
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
  return (
    <div
      className={cn(
        "flex min-w-[240px] flex-1 flex-col rounded-xl border-t-2 bg-zinc-950/50 p-3",
        getColumnColor(status)
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          {statusLabels[status]}
        </h3>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs tabular-nums text-zinc-400">
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
          <div className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-600">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
