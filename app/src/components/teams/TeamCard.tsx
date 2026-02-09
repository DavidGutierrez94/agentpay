"use client";

import { motion } from "framer-motion";
import { AddressDisplay } from "../shared/AddressDisplay";
import type { Team, ROLE_ICONS, AGENT_LEVEL_NAMES } from "@/lib/hooks/useTeams";

const roleIcons: Record<string, string> = {
  lead: "👑",
  backend: "⚙️",
  frontend: "🎨",
  researcher: "🔍",
  reviewer: "📋",
  worker: "🔧",
};

const levelBadges: Record<number, { label: string; color: string }> = {
  1: { label: "L1", color: "bg-zinc-600" },
  2: { label: "L2", color: "bg-blue-600" },
  3: { label: "L3", color: "bg-violet-600" },
  4: { label: "L4", color: "bg-amber-600" },
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
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-colors hover:border-zinc-700"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <h3 className="font-semibold text-white">{team.name}</h3>
          </div>
          {team.description && (
            <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
              {team.description}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            team.isActive
              ? "bg-green-500/10 text-green-400"
              : "bg-zinc-500/10 text-zinc-400"
          }`}
        >
          {team.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Lead */}
      {lead && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-500/5 p-2">
          <span>{roleIcons.lead}</span>
          <span className="text-xs text-amber-400">Lead</span>
          <AddressDisplay address={lead.wallet} chars={4} />
          <span className={`ml-auto rounded px-1.5 py-0.5 text-xs text-white ${levelBadges[lead.level]?.color || "bg-zinc-600"}`}>
            {levelBadges[lead.level]?.label || "L?"}
          </span>
        </div>
      )}

      {/* Team Members */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-medium text-zinc-500">
          Team Members ({team.memberCount})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {otherMembers.slice(0, 4).map((member) => (
            <div
              key={member.wallet}
              className="flex items-center gap-1 rounded-md bg-zinc-800/50 px-2 py-1"
              title={`${member.role} (Level ${member.level})`}
            >
              <span className="text-xs">{roleIcons[member.role] || "🔧"}</span>
              <span className="text-xs text-zinc-400">
                {member.wallet.slice(0, 4)}...
              </span>
              <span
                className={`rounded px-1 text-xs text-white ${
                  levelBadges[member.level]?.color || "bg-zinc-600"
                }`}
              >
                {levelBadges[member.level]?.label || "L?"}
              </span>
            </div>
          ))}
          {otherMembers.length > 4 && (
            <div className="flex items-center rounded-md bg-zinc-800/50 px-2 py-1 text-xs text-zinc-500">
              +{otherMembers.length - 4} more
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
            className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400"
          >
            {roleIcons[role] || "🔧"} {count} {role}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-3">
        <span className="text-xs text-zinc-500">
          Created {new Date(team.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onView}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          View Team
        </button>
      </div>
    </motion.div>
  );
}
