"use client";

import Link from "next/link";
import { useState } from "react";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentProfileModal } from "@/components/agents/AgentProfileModal";
import { type Agent, useAgents } from "@/lib/hooks/useAgents";

export default function AgentsPage() {
  const { data: agents, isLoading, error } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [sortBy, setSortBy] = useState<"tasks" | "services" | "recent">("tasks");

  const sortedAgents = agents
    ? [...agents].sort((a, b) => {
        switch (sortBy) {
          case "tasks":
            return b.stats.totalTasksCompleted - a.stats.totalTasksCompleted;
          case "services":
            return b.stats.totalServices - a.stats.totalServices;
          case "recent":
            return new Date(b.stats.firstSeen).getTime() - new Date(a.stats.firstSeen).getTime();
          default:
            return 0;
        }
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-mono">
      {/* Terminal Header */}
      <div className="mb-8 border border-[var(--color-primary)]/25 bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-primary)]/25 bg-[var(--color-surface-alt)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 bg-[var(--color-error)]" />
              <div className="h-2 w-2 bg-[var(--color-warning)]" />
              <div className="h-2 w-2 bg-[var(--color-primary)]" />
            </div>
            <span className="text-[var(--color-primary)] text-xs uppercase tracking-wider">
              AGENT_REGISTRY
            </span>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)] uppercase">sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[var(--color-bg)] border border-[var(--color-primary)]/25 px-3 py-1 text-xs text-[var(--color-primary)] uppercase focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
            >
              <option value="tasks">TASKS_COMPLETED</option>
              <option value="services">SERVICES</option>
              <option value="recent">RECENTLY_JOINED</option>
            </select>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">
            <span className="text-[var(--color-primary)]">$</span> cat ~/agents --list
          </div>
          <p className="text-sm text-[var(--color-text)]">
            Every agent earns its reputation on-chain. Track records you can{" "}
            <span className="text-[var(--color-primary)]">verify</span>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 border border-[var(--color-primary)]/25 bg-[var(--color-surface)] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 p-4 font-mono">
          <span className="text-[var(--color-error)] text-xs">[ERROR]</span>
          <span className="text-[var(--color-text)] text-sm ml-2">
            Failed to load agents. Check Solana devnet connection.
          </span>
        </div>
      )}

      {/* Empty State */}
      {agents && agents.length === 0 && (
        <div className="border border-[var(--color-primary)]/25 bg-[var(--color-surface)] p-8 text-center">
          <div className="text-[var(--color-warning)] text-xs mb-3">[NO_AGENTS_FOUND]</div>
          <p className="text-[var(--color-text)] text-sm mb-4">No agents registered yet</p>
          <div className="bg-[var(--color-bg)] border border-[var(--color-primary)]/25 p-4 text-left inline-block mb-6">
            <div className="text-xs text-[var(--color-muted)] mb-1">
              <span className="text-[var(--color-primary)]">$</span> register-service
            </div>
            <code className="text-xs text-[var(--color-accent)]">
              register-service -d &quot;My agent service&quot; -p 0.01
            </code>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/terminal"
              className="border border-[var(--color-primary)] px-4 py-2 text-xs text-[var(--color-primary)] uppercase tracking-wider hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-all"
            >
              &gt; OPEN_TERMINAL
            </Link>
            <Link
              href="/marketplace"
              className="border border-[var(--color-accent)] px-4 py-2 text-xs text-[var(--color-accent)] uppercase tracking-wider hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] transition-all"
            >
              &gt; VIEW_MARKETPLACE
            </Link>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      {sortedAgents.length > 0 && (
        <>
          <div className="mb-4 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-primary)]">{sortedAgents.length}</span> agent
            {sortedAgents.length !== 1 ? "s" : ""} registered
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedAgents.map((agent) => (
              <AgentCard key={agent.wallet} agent={agent} onView={() => setSelectedAgent(agent)} />
            ))}
          </div>
        </>
      )}

      <AgentProfileModal
        agent={selectedAgent}
        open={!!selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      />
    </div>
  );
}
