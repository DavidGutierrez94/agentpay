"use client";

import { AddressDisplay } from "../shared/AddressDisplay";
import type { ProtocolStats } from "@/lib/hooks/useProtocolStats";

export function TopProviders({ stats }: { stats: ProtocolStats | undefined }) {
  if (!stats || stats.topProviders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        No providers yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">Provider</th>
            <th className="pb-2 text-right font-medium">Completed</th>
          </tr>
        </thead>
        <tbody>
          {stats.topProviders.map((p, i) => (
            <tr
              key={p.address}
              className="border-b border-zinc-800/50 last:border-0"
            >
              <td className="py-2 text-zinc-500">{i + 1}</td>
              <td className="py-2">
                <AddressDisplay address={p.address} chars={6} />
              </td>
              <td className="py-2 text-right tabular-nums text-emerald-400">
                {p.tasksCompleted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
