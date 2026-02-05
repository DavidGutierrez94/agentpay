"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "../shared/StatusBadge";
import { ZKBadge } from "../shared/ZKBadge";
import { EscrowBadge } from "../shared/EscrowBadge";
import { DeadlineTimer } from "../shared/DeadlineTimer";
import { AddressDisplay } from "../shared/AddressDisplay";
import type { TaskRequest } from "@/lib/hooks/useTasks";

export function TaskCard({
  task,
  onClick,
}: {
  task: TaskRequest;
  onClick: (task: TaskRequest) => void;
}) {
  return (
    <motion.div
      layoutId={task.pda}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(task)}
      className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 transition-colors hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-sm text-zinc-300 line-clamp-2">
          {task.description}
        </p>
        {task.zkVerified && <ZKBadge />}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <EscrowBadge sol={task.amountSol} />
        {(task.status === "open" || task.status === "submitted") && (
          <DeadlineTimer deadlineTs={task.deadlineTs} />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <span>From:</span>
          <AddressDisplay address={task.requester} chars={3} />
        </div>
        <div className="flex items-center gap-1">
          <span>To:</span>
          <AddressDisplay address={task.provider} chars={3} />
        </div>
      </div>
    </motion.div>
  );
}
