"use client";

import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import type { Agent } from "@/lib/hooks/useAgents";

interface AgentCardProps {
  agent: Agent;
  onView: () => void;
}

export function AgentCard({ agent, onView }: AgentCardProps) {
  const zkPercentage =
    agent.stats.totalTasksCompleted > 0
      ? Math.round(
          (agent.stats.zkVerifiedCount / agent.stats.totalTasksCompleted) * 100
        )
      : 0;

  const joinedDate = new Date(agent.stats.firstSeen);
  const joinedFormatted = joinedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col border border-[#00ff41]/25 bg-[#111111] transition-all hover:border-[#00ff41] hover:shadow-[0_0_20px_rgba(0,255,65,0.1)]"
    >
      {/* Card Header */}
      <div className="border-b border-[#00ff41]/25 bg-[#1a1a1a] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-[#00ff41]" />
            <div className="h-1.5 w-1.5 bg-[#00ff41]/50" />
            <div className="h-1.5 w-1.5 bg-[#00ff41]/25" />
          </div>
          <span className="text-[#00ff41] text-[10px] uppercase tracking-wider">
            AGENT
          </span>
        </div>
        {agent.stats.disputeCountAsProvider === 0 && agent.stats.totalTasksCompleted > 0 && (
          <span className="text-[#00ff41] text-[10px]">[CLEAN_RECORD]</span>
        )}
        {agent.stats.disputeRateAsRequester >= 30 && (
          <span className="text-[#ff3333] text-[10px]">[HIGH_DISPUTE]</span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Agent Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center border border-[#00ff41]/50 bg-[#00ff41]/10 text-lg">
            <span className="text-[#00ff41] text-sm font-mono">&gt;_</span>
          </div>
          <div>
            <AddressDisplay address={agent.wallet} chars={4} />
            <p className="text-[10px] text-[#666666] uppercase mt-0.5">
              Joined {joinedFormatted}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-[#00ff41]/25 bg-[#0a0a0a] px-3 py-2">
            <p className="text-[10px] text-[#666666] uppercase">TASKS</p>
            <p className="text-lg font-mono text-[#00ff41]">
              {agent.stats.totalTasksCompleted}
            </p>
          </div>
          <div className="border border-[#00d4ff]/25 bg-[#0a0a0a] px-3 py-2">
            <p className="text-[10px] text-[#666666] uppercase">SERVICES</p>
            <p className="text-lg font-mono text-[#00d4ff]">
              {agent.stats.activeServices}
              <span className="text-sm text-[#666666]">
                /{agent.stats.totalServices}
              </span>
            </p>
          </div>
        </div>

        {/* ZK Verification */}
        {agent.stats.zkVerifiedCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="border border-[#ff0080]/50 bg-[#ff0080]/10 px-2 py-0.5 text-[10px] text-[#ff0080] uppercase font-mono zk-glow">
              ZK
            </span>
            <span className="text-xs text-[#666666]">
              {zkPercentage}% verified ({agent.stats.zkVerifiedCount})
            </span>
          </div>
        )}

        {/* Services Preview */}
        {agent.services.length > 0 && (
          <div className="mt-4 border-t border-[#00ff41]/25 pt-3">
            <p className="mb-2 text-[10px] text-[#666666] uppercase">
              services_offered:
            </p>
            <div className="flex flex-wrap gap-1">
              {agent.services.slice(0, 3).map((service) => (
                <span
                  key={service.pda}
                  className="border border-[#666666]/50 bg-[#0a0a0a] px-2 py-1 text-[10px] text-[#c0c0c0] font-mono"
                >
                  {service.description.length > 20
                    ? service.description.slice(0, 20) + "..."
                    : service.description}
                </span>
              ))}
              {agent.services.length > 3 && (
                <span className="border border-[#666666]/50 bg-[#0a0a0a] px-2 py-1 text-[10px] text-[#666666] font-mono">
                  +{agent.services.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dispute Warnings */}
        {agent.stats.disputeCountAsProvider > 0 && (
          <div className="mt-3 border border-[#ffcc00]/50 bg-[#ffcc00]/10 px-3 py-2 text-[10px] text-[#ffcc00] font-mono">
            [WARN] {agent.stats.disputeCountAsProvider} dispute
            {agent.stats.disputeCountAsProvider > 1 ? "s" : ""} as provider
          </div>
        )}
        {agent.stats.disputeRateAsRequester >= 30 && (
          <div className="mt-3 border border-[#ff3333]/50 bg-[#ff3333]/10 px-3 py-2 text-[10px] text-[#ff3333] font-mono">
            [ALERT] {agent.stats.disputeRateAsRequester}% dispute rate
            ({agent.stats.disputeCountAsRequester}/{agent.stats.tasksCreatedAsRequester})
          </div>
        )}

        {/* Actions */}
        <div className="mt-4">
          <button
            onClick={onView}
            className="w-full border border-[#00ff41] py-2 text-xs text-[#00ff41] uppercase tracking-wider transition-all hover:bg-[#00ff41] hover:text-[#0a0a0a] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)]"
          >
            &gt; VIEW_PROFILE
          </button>
        </div>
      </div>
    </motion.div>
  );
}
