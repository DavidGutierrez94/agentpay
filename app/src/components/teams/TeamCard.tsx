"use client";

import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import type { Team, ROLE_ICONS, AGENT_LEVEL_NAMES } from "@/lib/hooks/useTeams";

const roleLabels: Record<string, string> = {
  lead: "LEAD",
  backend: "BACKEND",
  frontend: "FRONTEND",
  researcher: "RESEARCH",
  reviewer: "REVIEW",
  worker: "WORKER",
};

const levelBadges: Record<number, { label: string; color: string }> = {
  1: { label: "L1", color: "#666666" },
  2: { label: "L2", color: "#00d4ff" },
  3: { label: "L3", color: "#ff0080" },
  4: { label: "L4", color: "#ffcc00" },
};

interface TeamCardProps {
  team: Team;
  onView: () => void;
}

export function TeamCard({ team, onView }: TeamCardProps) {
  const lead = team.members.find((m) => m.role === "lead");
  const otherMembers = team.members.filter((m) => m.role !== "lead");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-primary)]"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      {/* Header */}
      <div className="border-b border-[var(--color-border)] pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-primary)] font-mono">&gt;_</span>
            <h3 className="font-semibold text-[var(--color-text)] font-mono">{team.name}</h3>
          </div>
          <span
            className={`text-[10px] uppercase tracking-wider ${
              team.isActive
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            [{team.isActive ? "ACTIVE" : "INACTIVE"}]
          </span>
        </div>
        {team.description && (
          <p className="mt-2 text-sm text-[var(--color-muted)] line-clamp-2">
            {team.description}
          </p>
        )}
      </div>

      {/* Lead */}
      {lead && (
        <div
          className="mb-3 flex items-center gap-2 border border-[#ffcc00]/50 bg-[#ffcc00]/10 p-2"
          style={{ borderRadius: "var(--border-radius-sm)" }}
        >
          <span className="text-[10px] text-[#ffcc00] uppercase">[LEAD]</span>
          <AddressDisplay address={lead.wallet} chars={4} />
          <span
            className="ml-auto px-1.5 py-0.5 text-xs font-mono"
            style={{
              backgroundColor: `${levelBadges[lead.level]?.color}20`,
              color: levelBadges[lead.level]?.color,
              borderRadius: "var(--border-radius-sm)",
            }}
          >
            {levelBadges[lead.level]?.label || "L?"}
          </span>
        </div>
      )}

      {/* Team Members */}
      <div className="mb-4">
        <div className="mb-2 text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
          team_members: {team.memberCount}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {otherMembers.slice(0, 4).map((member) => (
            <div
              key={member.wallet}
              className="flex items-center gap-1 border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
              style={{ borderRadius: "var(--border-radius-sm)" }}
              title={`${member.role} (Level ${member.level})`}
            >
              <span className="text-[10px] text-[var(--color-muted)] uppercase">
                {roleLabels[member.role] || "WORKER"}
              </span>
              <span className="text-xs text-[var(--color-text)] font-mono">
                {member.wallet.slice(0, 4)}...
              </span>
              <span
                className="px-1 text-xs font-mono"
                style={{
                  color: levelBadges[member.level]?.color || "#666666",
                }}
              >
                {levelBadges[member.level]?.label || "L?"}
              </span>
            </div>
          ))}
          {otherMembers.length > 4 && (
            <div
              className="flex items-center border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-muted)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              +{otherMembers.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Role Distribution */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(
          team.members.reduce(
            (acc, m) => ({ ...acc, [m.role]: (acc[m.role] || 0) + 1 }),
            {} as Record<string, number>
          )
        ).map(([role, count]) => (
          <span
            key={role}
            className="border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted)] uppercase font-mono"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            {roleLabels[role] || "WORKER"}: {count}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <span className="text-xs text-[var(--color-muted)]">
          {new Date(team.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onView}
          className="border border-[var(--color-primary)] px-3 py-1.5 text-xs text-[var(--color-primary)] uppercase tracking-wider transition-all hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]"
          style={{ borderRadius: "var(--border-radius-sm)" }}
        >
          &gt; VIEW_TEAM
        </button>
      </div>
    </motion.div>
  );
}
