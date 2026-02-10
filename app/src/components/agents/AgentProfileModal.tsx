"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import type { Agent } from "@/lib/hooks/useAgents";
import { AddressDisplay } from "../shared/AddressDisplay";
import { ZKBadge } from "../shared/ZKBadge";

interface AgentProfileModalProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RiskScore {
  score: number;
  level: "low" | "medium" | "high";
  loading: boolean;
  error?: string;
}

export function AgentProfileModal({ agent, open, onOpenChange }: AgentProfileModalProps) {
  const [riskScore, setRiskScore] = useState<RiskScore>({
    score: 0,
    level: "low",
    loading: true,
  });

  // Fetch REKT Shield risk score
  useEffect(() => {
    if (!agent) return;

    async function fetchRiskScore() {
      try {
        const res = await fetch(`/api/v1/scan/${agent!.wallet}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.risk) {
            const score = data.risk.score ?? 0;
            const level = score < 30 ? "low" : score < 60 ? "medium" : "high";
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
  }, [agent]);

  if (!agent) return null;

  const zkPercentage =
    agent.stats.totalTasksCompleted > 0
      ? Math.round((agent.stats.zkVerifiedCount / agent.stats.totalTasksCompleted) * 100)
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
      ? "text-[var(--color-success)]"
      : riskScore.level === "medium"
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-error)]";

  const riskBgClass =
    riskScore.level === "low"
      ? "bg-[var(--color-success)]/10"
      : riskScore.level === "medium"
        ? "bg-[var(--color-warning)]/10"
        : "bg-[var(--color-error)]/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader label="AGENT_PROFILE">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-3xl"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              🤖
            </div>
            <div>
              <DialogTitle>Agent Profile</DialogTitle>
              <AddressDisplay address={agent.wallet} chars={8} />
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Active since {joinedFormatted}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div
              className="bg-[var(--color-surface)] p-4 text-center"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <p className="text-2xl font-bold text-[var(--color-text-bright)]">
                {agent.stats.totalTasksCompleted}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Tasks Completed</p>
            </div>
            <div
              className="bg-[var(--color-surface)] p-4 text-center"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <p className="text-2xl font-bold text-[var(--color-text-bright)]">
                {agent.stats.zkVerifiedCount}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">ZK Verified</p>
            </div>
            <div
              className="bg-[var(--color-surface)] p-4 text-center"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <p className="text-2xl font-bold text-[var(--color-text-bright)]">
                {agent.stats.activeServices}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Active Services</p>
            </div>
            <div
              className="bg-[var(--color-surface)] p-4 text-center"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <p
                className={`text-2xl font-bold ${
                  agent.stats.disputeCountAsProvider === 0
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-warning)]"
                }`}
              >
                {agent.stats.disputeCountAsProvider}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">Disputes (Provider)</p>
            </div>
          </div>

          {/* Requester Trust Warning */}
          {agent.stats.disputeRateAsRequester >= 30 && (
            <div
              className="border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-4"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <p className="font-medium text-[var(--color-error)]">
                    High Dispute Rate as Requester
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    This agent disputes {agent.stats.disputeRateAsRequester}% of tasks they request
                    ({agent.stats.disputeCountAsRequester} out of{" "}
                    {agent.stats.tasksCreatedAsRequester} tasks). Exercise caution when providing
                    services to this wallet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Requester Stats - if they have any */}
          {agent.stats.tasksCreatedAsRequester > 0 && (
            <div
              className="bg-[var(--color-surface)] p-4"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <h3 className="mb-2 text-sm font-medium text-[var(--color-muted)]">As Requester</h3>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-[var(--color-text-bright)]">
                    {agent.stats.tasksCreatedAsRequester}
                  </span>
                  <span className="ml-1 text-[var(--color-muted)]">tasks created</span>
                </div>
                <div>
                  <span
                    className={
                      agent.stats.disputeCountAsRequester === 0
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-warning)]"
                    }
                  >
                    {agent.stats.disputeCountAsRequester}
                  </span>
                  <span className="ml-1 text-[var(--color-muted)]">disputes initiated</span>
                </div>
                <div>
                  <span
                    className={
                      agent.stats.disputeRateAsRequester < 20
                        ? "text-[var(--color-success)]"
                        : agent.stats.disputeRateAsRequester < 50
                          ? "text-[var(--color-warning)]"
                          : "text-[var(--color-error)]"
                    }
                  >
                    {agent.stats.disputeRateAsRequester}%
                  </span>
                  <span className="ml-1 text-[var(--color-muted)]">dispute rate</span>
                </div>
              </div>
            </div>
          )}

          {/* ZK Verification Bar */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {agent.stats.zkVerifiedCount > 0 && <ZKBadge />}
                <span className="text-sm text-[var(--color-muted)]">
                  {zkPercentage}% of tasks ZK verified
                </span>
              </div>
              <span className="text-sm text-[var(--color-muted)]">
                {agent.stats.zkVerifiedCount} / {agent.stats.totalTasksCompleted}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden bg-[var(--color-surface)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <div
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)]"
                style={{
                  width: `${zkPercentage}%`,
                  borderRadius: "var(--border-radius-sm)",
                  transition: "width 0.5s ease-out",
                }}
              />
            </div>
          </div>

          {/* REKT Shield Risk Score */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--color-muted)]">
              🛡️ REKT Shield Risk Assessment
            </h3>
            <div className={`p-4 ${riskBgClass}`} style={{ borderRadius: "var(--border-radius)" }}>
              {riskScore.loading ? (
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 animate-spin border-2 border-[var(--color-primary)] border-t-transparent"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  />
                  <span className="text-sm text-[var(--color-muted)]">Scanning wallet...</span>
                </div>
              ) : riskScore.error ? (
                <span className="text-sm text-[var(--color-muted)]">Risk score unavailable</span>
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
                      <p className="text-xs text-[var(--color-muted)]">
                        Based on on-chain activity analysis
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl">
                    {riskScore.level === "low" ? "✅" : riskScore.level === "medium" ? "⚠️" : "🚨"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--color-muted)]">
              Services Offered ({agent.services.length})
            </h3>
            {agent.services.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">No services registered</p>
            ) : (
              <div className="space-y-2">
                {agent.services.map((service) => (
                  <div
                    key={service.pda}
                    className="flex items-center justify-between border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-[var(--color-text-bright)]">
                        {service.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-muted)]">
                        <span>{service.tasksCompleted} tasks</span>
                        <span>•</span>
                        <span>Created {new Date(service.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs ${
                          service.isActive
                            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                            : "bg-[var(--color-surface)] text-[var(--color-muted)]"
                        }`}
                        style={{ borderRadius: "var(--border-radius-sm)" }}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="font-mono text-sm text-[var(--color-primary)]">
                        {service.priceSol} SOL
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={`https://explorer.solana.com/address/${agent.wallet}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 border border-[var(--color-border)] py-2.5 text-center text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              View on Explorer ↗
            </a>
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-[var(--color-primary)] py-2.5 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
