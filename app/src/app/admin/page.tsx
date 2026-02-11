"use client";

import { StatsCards } from "@/components/admin/StatsCards";
import { TaskStatusChart } from "@/components/admin/TaskStatusChart";
import { TopProviders } from "@/components/admin/TopProviders";
import { useProtocolStats } from "@/lib/hooks/useProtocolStats";

export default function AdminPage() {
  const { data: stats, isLoading } = useProtocolStats();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-mono">
      {/* Terminal Header */}
      <div className="mb-8 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div
                className="h-2 w-2 bg-[var(--color-error)]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
              <div
                className="h-2 w-2 bg-[var(--color-warning)]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
              <div
                className="h-2 w-2 bg-[var(--color-primary)]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
            </div>
            <span className="text-[var(--color-primary)] text-xs uppercase tracking-wider">
              ADMIN_DASHBOARD
            </span>
          </div>
          {isLoading && (
            <span className="text-xs text-[var(--color-muted)] animate-pulse">[LOADING...]</span>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">
            <span className="text-[var(--color-primary)]">$</span> cat ~/stats --aggregate
          </div>
          <p className="text-sm text-[var(--color-text)]">
            Aggregate protocol statistics from Solana devnet
          </p>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" />
              <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" style={{ opacity: 0.5 }} />
              <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" style={{ opacity: 0.25 }} />
            </div>
            <span className="text-[var(--color-primary)] text-[10px] uppercase tracking-wider">
              TASKS_BY_STATUS
            </span>
          </div>
          <TaskStatusChart stats={stats} />
        </div>

        <div
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 bg-[var(--color-accent)]" />
              <div className="h-1.5 w-1.5 bg-[var(--color-accent)]" style={{ opacity: 0.5 }} />
              <div className="h-1.5 w-1.5 bg-[var(--color-accent)]" style={{ opacity: 0.25 }} />
            </div>
            <span className="text-[var(--color-accent)] text-[10px] uppercase tracking-wider">
              TOP_PROVIDERS
            </span>
          </div>
          <TopProviders stats={stats} />
        </div>
      </div>
    </div>
  );
}
