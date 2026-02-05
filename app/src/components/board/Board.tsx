"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAllTasks, type TaskRequest } from "@/lib/hooks/useTasks";
import { TASK_STATUSES } from "@/lib/constants";
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
          (t) =>
            t.requester === publicKey.toBase58() ||
            t.provider === publicKey.toBase58()
        )
      : allTasks ?? [];

  const tasksByStatus = TASK_STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<string, TaskRequest[]>
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex rounded-lg border border-zinc-800 p-0.5">
          {(["all", "mine"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f === "all" ? "All Tasks" : "My Tasks"}
            </button>
          ))}
        </div>
        {isLoading && (
          <span className="text-xs text-zinc-500 animate-pulse">
            Loading...
          </span>
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

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
