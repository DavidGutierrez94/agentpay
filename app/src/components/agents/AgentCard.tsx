"use client";

import { motion } from "framer-motion";
import type { Agent } from "@/lib/hooks/useAgents";
import { AddressDisplay } from "../shared/AddressDisplay";

interface AgentCardProps {
  agent: Agent;
  onView: () => void;
}

export function AgentCard({ agent, onView }: AgentCardProps) {
  const zkPercentage =
    agent.stats.totalTasksCompleted > 0
      ? Math.round((agent.stats.zkVerifiedCount / agent.stats.totalTasksCompleted) * 100)
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
      className="group flex flex-col border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:border-[var(--color-border-bright)] hover:shadow-[var(--card-shadow)]"
    >
      {/* Card Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" />
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)] opacity-50" />
            <div className="h-1.5 w-1.5 bg-[var(--color-primary)] opacity-25" />
          </div>
          <span className="text-[var(--color-primary)] text-[10px] uppercase tracking-wider">
            AGENT
          </span>
        </div>
        {agent.stats.disputeCountAsProvider === 0 && agent.stats.totalTasksCompleted > 0 && (
          <span className="text-[var(--color-primary)] text-[10px]">[CLEAN_RECORD]</span>
        )}
        {agent.stats.disputeRateAsRequester >= 30 && (
          <span className="text-[var(--color-error)] text-[10px]">[HIGH_DISPUTE]</span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Agent Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center border border-[var(--color-primary)] opacity-50 bg-[var(--color-primary)]/10 text-lg">
            <span className="text-[var(--color-primary)] text-sm font-mono">&gt;_</span>
          </div>
          <div>
            <AddressDisplay address={agent.wallet} chars={4} />
            <p className="text-[10px] text-[var(--color-text-dim)] uppercase mt-0.5">
              Joined {joinedFormatted}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
            <p className="text-[10px] text-[var(--color-text-dim)] uppercase">TASKS</p>
            <p className="text-lg font-mono text-[var(--color-primary)]">
              {agent.stats.totalTasksCompleted}
            </p>
          </div>
          <div className="border border-[var(--color-accent)]/25 bg-[var(--color-bg)] px-3 py-2">
            <p className="text-[10px] text-[var(--color-text-dim)] uppercase">SERVICES</p>
            <p className="text-lg font-mono text-[var(--color-accent)]">
              {agent.stats.activeServices}
              <span className="text-sm text-[var(--color-text-dim)]">
                /{agent.stats.totalServices}
              </span>
            </p>
          </div>
        </div>

        {/* ZK Verification */}
        {agent.stats.zkVerifiedCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="border border-[var(--color-secondary)] opacity-50 bg-[var(--color-secondary)]/10 px-2 py-0.5 text-[10px] text-[var(--color-secondary)] uppercase font-mono zk-glow">
              ZK
            </span>
            <span className="text-xs text-[var(--color-text-dim)]">
              {zkPercentage}% verified ({agent.stats.zkVerifiedCount})
            </span>
          </div>
        )}

        {/* Services Preview */}
        {agent.services.length > 0 && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-3">
            <p className="mb-2 text-[10px] text-[var(--color-text-dim)] uppercase">
              services_offered:
            </p>
            <div className="flex flex-wrap gap-1">
              {agent.services.slice(0, 3).map((service) => (
                <span
                  key={service.pda}
                  className="border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[10px] text-[var(--color-text)] font-mono"
                >
                  {service.description.length > 20
                    ? `${service.description.slice(0, 20)}...`
                    : service.description}
                </span>
              ))}
              {agent.services.length > 3 && (
                <span className="border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[10px] text-[var(--color-text-dim)] font-mono">
                  +{agent.services.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dispute Warnings */}
        {agent.stats.disputeCountAsProvider > 0 && (
          <div className="mt-3 border border-[var(--color-warning)] opacity-50 bg-[var(--color-warning)]/10 px-3 py-2 text-[10px] text-[var(--color-warning)] font-mono">
            [WARN] {agent.stats.disputeCountAsProvider} dispute
            {agent.stats.disputeCountAsProvider > 1 ? "s" : ""} as provider
          </div>
        )}
        {agent.stats.disputeRateAsRequester >= 30 && (
          <div className="mt-3 border border-[var(--color-error)] opacity-50 bg-[var(--color-error)]/10 px-3 py-2 text-[10px] text-[var(--color-error)] font-mono">
            [ALERT] {agent.stats.disputeRateAsRequester}% dispute rate (
            {agent.stats.disputeCountAsRequester}/{agent.stats.tasksCreatedAsRequester})
          </div>
        )}

        {/* Actions */}
        <div className="mt-4">
          <button
            onClick={onView}
            className="w-full border border-[var(--color-primary)] py-2 text-xs text-[var(--color-primary)] uppercase tracking-wider transition-all hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] hover:shadow-[var(--glow-primary)]"
          >
            &gt; VIEW_PROFILE
          </button>
        </div>
      </div>
    </motion.div>
  );
}
