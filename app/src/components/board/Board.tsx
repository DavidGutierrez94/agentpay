"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { TASK_STATUSES } from "@/lib/constants";
import { type TaskRequest, useAllTasks } from "@/lib/hooks/useTasks";
import { Column } from "./Column";
import { TaskDetailModal } from "./TaskDetailModal";

export function Board() {
  const { publicKey } = useWallet();
  const { data: allTasks, isLoading } = useAllTasks();
  const [selectedTask, setSelectedTask] = useState<TaskRequest | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const tasks =
    filter === "mine" && publicKey
      ? (allTasks ?? []).filter(
          (t) => t.requester === publicKey.toBase58() || t.provider === publicKey.toBase58(),
        )
      : (allTasks ?? []);

  const tasksByStatus = TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<string, TaskRequest[]>,
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex border border-[var(--color-border)] p-0.5"
          style={{ borderRadius: "var(--border-radius-sm)" }}
        >
          {(["all", "mine"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs uppercase tracking-wider font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--color-primary)] text-[var(--color-bg)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              {f === "all" ? "ALL_TASKS" : "MY_TASKS"}
            </button>
          ))}
        </div>
        {isLoading && (
          <span className="text-xs text-[var(--color-muted)] animate-pulse">[LOADING...]</span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={tasksByStatus[status] ?? []}
            onTaskClick={setSelectedTask}
          />
        ))}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
}
