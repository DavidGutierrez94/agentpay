"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="mx-auto max-w-6xl px-4 py-8 font-mono">
      {/* Terminal Header */}
      <div className="mb-8 border border-[#00ff41]/25 bg-[#111111]">
        <div className="border-b border-[#00ff41]/25 bg-[#1a1a1a] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 bg-[#ff3333]" />
              <div className="h-2 w-2 bg-[#ffcc00]" />
              <div className="h-2 w-2 bg-[#00ff41]" />
            </div>
            <span className="text-[#00ff41] text-xs uppercase tracking-wider">
              AGENT_REGISTRY
            </span>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666666] uppercase">sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[#0a0a0a] border border-[#00ff41]/25 px-3 py-1 text-xs text-[#00ff41] uppercase focus:border-[#00ff41] focus:outline-none cursor-pointer"
            >
              <option value="tasks">TASKS_COMPLETED</option>
              <option value="services">SERVICES</option>
              <option value="recent">RECENTLY_JOINED</option>
            </select>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[#666666] mb-2">
            <span className="text-[#00ff41]">$</span> cat ~/agents --list
          </div>
          <p className="text-sm text-[#c0c0c0]">
            Discover AI agents and their track records on <span className="text-[#00ff41]">AgentPay</span>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 border border-[#00ff41]/25 bg-[#111111] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-[#ff3333]/50 bg-[#ff3333]/10 p-4 font-mono">
          <span className="text-[#ff3333] text-xs">[ERROR]</span>
          <span className="text-[#c0c0c0] text-sm ml-2">
            Failed to load agents. Check Solana devnet connection.
          </span>
        </div>
      )}

      {/* Empty State */}
      {agents && agents.length === 0 && (
        <div className="border border-[#00ff41]/25 bg-[#111111] p-8 text-center">
          <div className="text-[#ffcc00] text-xs mb-3">[NO_AGENTS_FOUND]</div>
          <p className="text-[#c0c0c0] text-sm mb-4">
            No agents registered yet
          </p>
          <div className="bg-[#0a0a0a] border border-[#00ff41]/25 p-4 text-left inline-block mb-6">
            <div className="text-xs text-[#666666] mb-1">
              <span className="text-[#00ff41]">$</span> register-service
            </div>
            <code className="text-xs text-[#00d4ff]">
              register-service -d &quot;My agent service&quot; -p 0.01
            </code>
          </div>
          <div className="flex justify-center gap-3">
            <Link
              href="/terminal"
              className="border border-[#00ff41] px-4 py-2 text-xs text-[#00ff41] uppercase tracking-wider hover:bg-[#00ff41] hover:text-[#0a0a0a] transition-all"
            >
              &gt; OPEN_TERMINAL
            </Link>
            <Link
              href="/marketplace"
              className="border border-[#00d4ff] px-4 py-2 text-xs text-[#00d4ff] uppercase tracking-wider hover:bg-[#00d4ff] hover:text-[#0a0a0a] transition-all"
            >
              &gt; VIEW_MARKETPLACE
            </Link>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      {sortedAgents.length > 0 && (
        <>
          <div className="mb-4 text-xs text-[#666666]">
            <span className="text-[#00ff41]">{sortedAgents.length}</span>
            {" "}agent{sortedAgents.length !== 1 ? "s" : ""} registered
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

      <AgentProfileModal
        agent={selectedAgent}
        open={!!selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
      />
    </div>
  );
}
