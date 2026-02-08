"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import { ZKBadge } from "../shared/ZKBadge";
import type { Agent } from "@/lib/hooks/useAgents";

interface AgentProfileModalProps {
  agent: Agent;
  onClose: () => void;
}

interface RiskScore {
  score: number;
  level: "low" | "medium" | "high";
  loading: boolean;
  error?: string;
}

export function AgentProfileModal({ agent, onClose }: AgentProfileModalProps) {
  const [riskScore, setRiskScore] = useState<RiskScore>({
    score: 0,
    level: "low",
    loading: true,
  });

  // Fetch REKT Shield risk score
  useEffect(() => {
    async function fetchRiskScore() {
      try {
        const res = await fetch(`/api/v1/scan/${agent.wallet}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.risk) {
            const score = data.risk.score ?? 0;
            const level =
              score < 30 ? "low" : score < 60 ? "medium" : "high";
            setRiskScore({ score, level, loading: false });
          } else {
            setRiskScore({ score: 0, level: "low", loading: false });
          }
        } else {
          setRiskScore({ score: 0, level: "low", loading: false, error: "Failed to fetch" });
        }
      } catch {
        setRiskScore({ score: 0, level: "low", loading: false, error: "Network error" });
      }
    }
    fetchRiskScore();
  }, [agent.wallet]);

  const zkPercentage =
    agent.stats.totalTasksCompleted > 0
      ? Math.round(
          (agent.stats.zkVerifiedCount / agent.stats.totalTasksCompleted) * 100
        )
      : 0;

  const joinedDate = new Date(agent.stats.firstSeen);
  const joinedFormatted = joinedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const riskColorClass =
    riskScore.level === "low"
      ? "text-green-400"
      : riskScore.level === "medium"
      ? "text-yellow-400"
      : "text-red-400";

  const riskBgClass =
    riskScore.level === "low"
      ? "bg-green-500/10"
      : riskScore.level === "medium"
      ? "bg-yellow-500/10"
      : "bg-red-500/10";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-3xl">
                🤖
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Agent Profile</h2>
                <AddressDisplay address={agent.wallet} chars={8} />
                <p className="mt-1 text-sm text-zinc-500">
                  Active since {joinedFormatted}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-zinc-800/50 p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {agent.stats.totalTasksCompleted}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Tasks Completed</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {agent.stats.zkVerifiedCount}
              </p>
              <p className="mt-1 text-xs text-zinc-500">ZK Verified</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {agent.stats.activeServices}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Active Services</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4 text-center">
              <p
                className={`text-2xl font-bold ${
                  agent.stats.disputeCountAsProvider === 0 ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {agent.stats.disputeCountAsProvider}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Disputes (Provider)</p>
            </div>
          </div>

          {/* Requester Trust Warning */}
          {agent.stats.disputeRateAsRequester >= 30 && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-medium text-red-400">High Dispute Rate as Requester</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    This agent disputes {agent.stats.disputeRateAsRequester}% of tasks they request
                    ({agent.stats.disputeCountAsRequester} out of {agent.stats.tasksCreatedAsRequester} tasks).
                    Exercise caution when providing services to this wallet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requester Stats - if they have any */}
          {agent.stats.tasksCreatedAsRequester > 0 && (
            <div className="mt-4 rounded-xl bg-zinc-800/30 p-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-400">As Requester</h3>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-white">{agent.stats.tasksCreatedAsRequester}</span>
                  <span className="ml-1 text-zinc-500">tasks created</span>
                </div>
                <div>
                  <span className={agent.stats.disputeCountAsRequester === 0 ? "text-green-400" : "text-yellow-400"}>
                    {agent.stats.disputeCountAsRequester}
                  </span>
                  <span className="ml-1 text-zinc-500">disputes initiated</span>
                </div>
                <div>
                  <span className={agent.stats.disputeRateAsRequester < 20 ? "text-green-400" : agent.stats.disputeRateAsRequester < 50 ? "text-yellow-400" : "text-red-400"}>
                    {agent.stats.disputeRateAsRequester}%
                  </span>
                  <span className="ml-1 text-zinc-500">dispute rate</span>
                </div>
              </div>
            </div>
          )}

          {/* ZK Verification Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {agent.stats.zkVerifiedCount > 0 && <ZKBadge />}
                <span className="text-sm text-zinc-400">
                  {zkPercentage}% of tasks ZK verified
                </span>
              </div>
              <span className="text-sm text-zinc-500">
                {agent.stats.zkVerifiedCount} / {agent.stats.totalTasksCompleted}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${zkPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
              />
            </div>
          </div>

          {/* REKT Shield Risk Score */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-zinc-400">
              🛡️ REKT Shield Risk Assessment
            </h3>
            <div className={`rounded-xl ${riskBgClass} p-4`}>
              {riskScore.loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  <span className="text-sm text-zinc-400">Scanning wallet...</span>
                </div>
              ) : riskScore.error ? (
                <span className="text-sm text-zinc-500">
                  Risk score unavailable
                </span>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-bold ${riskColorClass}`}>
                      {riskScore.score}
                    </span>
                    <div>
                      <p className={`font-medium ${riskColorClass}`}>
                        {riskScore.level === "low"
                          ? "Low Risk"
                          : riskScore.level === "medium"
                          ? "Medium Risk"
                          : "High Risk"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Based on on-chain activity analysis
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl">
                    {riskScore.level === "low"
                      ? "✅"
                      : riskScore.level === "medium"
                      ? "⚠️"
                      : "🚨"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-medium text-zinc-400">
              Services Offered ({agent.services.length})
            </h3>
            {agent.services.length === 0 ? (
              <p className="text-sm text-zinc-500">No services registered</p>
            ) : (
              <div className="space-y-2">
                {agent.services.map((service) => (
                  <div
                    key={service.pda}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-white">{service.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                        <span>{service.tasksCompleted} tasks</span>
                        <span>•</span>
                        <span>Created {new Date(service.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          service.isActive
                            ? "bg-green-500/10 text-green-400"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="font-mono text-sm text-violet-400">
                        {service.priceSol} SOL
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <a
              href={`https://explorer.solana.com/address/${agent.wallet}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-center text-sm font-medium text-white transition-colors hover:border-violet-500 hover:text-violet-400"
            >
              View on Explorer ↗
            </a>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
