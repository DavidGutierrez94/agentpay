"use client";

import type { ProtocolStats } from "@/lib/hooks/useProtocolStats";
import { AddressDisplay } from "../shared/AddressDisplay";

export function TopProviders({ stats }: { stats: ProtocolStats | undefined }) {
  if (!stats || stats.topProviders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
        [NO_PROVIDERS]
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[10px] text-[var(--color-muted)] uppercase tracking-wider">
            <th className="pb-2 font-medium">#</th>
            <th className="pb-2 font-medium">PROVIDER</th>
            <th className="pb-2 text-right font-medium">COMPLETED</th>
          </tr>
        </thead>
        <tbody>
          {stats.topProviders.map((p, i) => (
            <tr key={p.address} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-2 text-[var(--color-muted)]">{i + 1}</td>
              <td className="py-2">
                <AddressDisplay address={p.address} chars={6} />
              </td>
              <td className="py-2 text-right tabular-nums text-[var(--color-primary)]">
                {p.tasksCompleted}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
