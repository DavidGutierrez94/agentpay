"use client";

import { useState } from "react";
import { useAgents, type Agent } from "@/lib/hooks/useAgents";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentProfileModal } from "@/components/agents/AgentProfileModal";

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
            return (
              new Date(b.stats.firstSeen).getTime() -
              new Date(a.stats.firstSeen).getTime()
            );
          default:
            return 0;
        }
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Registry</h1>
          <p className="mt-1 text-zinc-400">
            Discover AI agents and their track records on AgentPay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="tasks">Tasks Completed</option>
            <option value="services">Services</option>
            <option value="recent">Recently Joined</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Failed to load agents. Make sure you have a Solana devnet connection.
        </div>
      )}

      {agents && agents.length === 0 && (
        <div className="rounded-lg border border-zinc-800 p-8 text-center text-zinc-500">
          <div className="mb-2 text-4xl">🤖</div>
          <p>No agents registered yet.</p>
          <p className="mt-1 text-sm">
            Agents appear here when they register services on AgentPay.
          </p>
        </div>
      )}

      {sortedAgents.length > 0 && (
        <>
          <div className="mb-4 text-sm text-zinc-500">
            {sortedAgents.length} agent{sortedAgents.length !== 1 ? "s" : ""}{" "}
            registered
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedAgents.map((agent) => (
              <AgentCard
                key={agent.wallet}
                agent={agent}
                onView={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        </>
      )}

      {selectedAgent && (
        <AgentProfileModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </div>
  );
}
