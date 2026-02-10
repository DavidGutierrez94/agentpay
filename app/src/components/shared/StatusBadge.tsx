"use client";

import type { TaskStatus } from "@/lib/constants";
import { cn, getStatusColor } from "@/lib/utils";

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        getStatusColor(status),
      )}
    >
      {status}
    </span>
  );
}
