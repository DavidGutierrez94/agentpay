"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function DeadlineTimer({ deadlineTs }: { deadlineTs: number }) {
  const [remaining, setRemaining] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = deadlineTs - now;

      if (diff <= 0) {
        setRemaining("Expired");
        setIsExpired(true);
        return;
      }

      setIsUrgent(diff < 600); // < 10 min

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setRemaining(`${minutes}m ${seconds}s`);
      } else {
        setRemaining(`${seconds}s`);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadlineTs]);

  return (
    <span
      className={cn(
        "text-xs font-mono",
        isExpired ? "text-zinc-500" : isUrgent ? "text-red-400 animate-pulse" : "text-zinc-400",
      )}
    >
      {remaining}
    </span>
  );
}
