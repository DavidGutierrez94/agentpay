"use client";

import { useProtocolStats } from "@/lib/hooks/useProtocolStats";
import { StatsCards } from "@/components/admin/StatsCards";
import { TaskStatusChart } from "@/components/admin/TaskStatusChart";
import { TopProviders } from "@/components/admin/TopProviders";

export default function AdminPage() {
  const { data: stats, isLoading } = useProtocolStats();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Aggregate protocol statistics from Solana devnet
        </p>
        {isLoading && (
          <span className="text-xs text-zinc-500 animate-pulse">
            Loading on-chain data...
          </span>
        )}
      </div>

      <StatsCards stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Tasks by Status
          </h2>
          <TaskStatusChart stats={stats} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300">
            Top Providers
          </h2>
          <TopProviders stats={stats} />
        </div>
      </div>
    </div>
  );
}
