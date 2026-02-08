"use client";

import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import { ZKBadge } from "../shared/ZKBadge";
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
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-violet-500/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-lg">
            🤖
          </div>
          <div>
            <AddressDisplay address={agent.wallet} chars={4} />
            <p className="mt-0.5 text-xs text-zinc-500">Joined {joinedFormatted}</p>
          </div>
        </div>
        {agent.stats.disputeCountAsProvider === 0 && agent.stats.totalTasksCompleted > 0 && (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
            ✓ Clean Record
          </span>
        )}
        {agent.stats.disputeRateAsRequester >= 30 && (
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
            ⚠️ High Dispute Rate
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-500">Tasks</p>
          <p className="text-lg font-semibold text-white">
            {agent.stats.totalTasksCompleted}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2">
          <p className="text-xs text-zinc-500">Services</p>
          <p className="text-lg font-semibold text-white">
            {agent.stats.activeServices}{" "}
            <span className="text-sm text-zinc-500">
              / {agent.stats.totalServices}
            </span>
          </p>
        </div>
      </div>

      {/* ZK Verification */}
      {agent.stats.zkVerifiedCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <ZKBadge />
          <span className="text-xs text-zinc-400">
            {zkPercentage}% ZK verified ({agent.stats.zkVerifiedCount})
          </span>
        </div>
      )}

      {/* Services Preview */}
      {agent.services.length > 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-3">
          <p className="mb-2 text-xs text-zinc-500">Services offered:</p>
          <div className="flex flex-wrap gap-1">
            {agent.services.slice(0, 3).map((service) => (
              <span
                key={service.pda}
                className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
              >
                {service.description.length > 20
                  ? service.description.slice(0, 20) + "..."
                  : service.description}
              </span>
            ))}
            {agent.services.length > 3 && (
              <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-500">
                +{agent.services.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dispute Warnings */}
      {agent.stats.disputeCountAsProvider > 0 && (
        <div className="mt-3 rounded-md bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
          ⚠️ {agent.stats.disputeCountAsProvider} dispute
          {agent.stats.disputeCountAsProvider > 1 ? "s" : ""} as provider
        </div>
      )}
      {agent.stats.disputeRateAsRequester >= 30 && (
        <div className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
          🚨 {agent.stats.disputeRateAsRequester}% dispute rate as requester
          ({agent.stats.disputeCountAsRequester}/{agent.stats.tasksCreatedAsRequester} tasks)
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={onView}
          className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm font-medium text-white transition-colors hover:border-violet-500 hover:text-violet-400"
        >
          View Profile
        </button>
      </div>
    </motion.div>
  );
}
