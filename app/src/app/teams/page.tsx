"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTeams } from "@/lib/hooks/useTeams";
import { TeamCard } from "@/components/teams/TeamCard";
import { TeamProfileModal } from "@/components/teams/TeamProfileModal";
import { CreateTeamModal } from "@/components/teams/CreateTeamModal";

export default function TeamsPage() {
  const { publicKey } = useWallet();
  const { data: teams, isLoading, error, refetch } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "my">("all");
  const [sortBy, setSortBy] = useState<"recent" | "members" | "name">("recent");

  // Filter teams
  const filteredTeams = teams
    ? teams
        .filter((team) => {
          if (filter === "my" && publicKey) {
            return team.members.some(
              (m) => m.wallet === publicKey.toBase58()
            );
          }
          return true;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "members":
              return b.memberCount - a.memberCount;
            case "name":
              return a.name.localeCompare(b.name);
            case "recent":
            default:
              return (
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
          }
        })
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-mono">
      {/* Terminal Header */}
      <div className="mb-8 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 bg-[#ff3333]" style={{ borderRadius: "var(--border-radius-sm)" }} />
              <div className="h-2 w-2 bg-[#ffcc00]" style={{ borderRadius: "var(--border-radius-sm)" }} />
              <div className="h-2 w-2 bg-[var(--color-primary)]" style={{ borderRadius: "var(--border-radius-sm)" }} />
            </div>
            <span className="text-[var(--color-primary)] text-xs uppercase tracking-wider">
              TEAM_REGISTRY
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!publicKey}
            className="border border-[var(--color-primary)] px-4 py-1.5 text-xs text-[var(--color-primary)] uppercase tracking-wider transition-all hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            + CREATE_TEAM
          </button>
        </div>
        <div className="p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">
            <span className="text-[var(--color-primary)]">$</span> cat ~/teams --list
          </div>
          <p className="text-sm text-[var(--color-text)]">
            Coordinate multi-agent teams for complex tasks
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`border px-4 py-2 text-xs uppercase tracking-wider transition-all ${
              filter === "all"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            ALL_TEAMS
          </button>
          <button
            onClick={() => setFilter("my")}
            disabled={!publicKey}
            className={`border px-4 py-2 text-xs uppercase tracking-wider transition-all ${
              filter === "my"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-bg)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            MY_TEAMS
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)] uppercase">sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-primary)] uppercase focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            <option value="recent">MOST_RECENT</option>
            <option value="members">MOST_MEMBERS</option>
            <option value="name">NAME_A-Z</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse border border-[var(--color-border)] bg-[var(--color-surface)]"
              style={{ borderRadius: "var(--border-radius)" }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-[#ff3333]/50 bg-[#ff3333]/10 p-4 text-sm text-[#ff3333] font-mono">
          <span className="text-[#ff3333] text-xs">[ERROR]</span>
          <span className="ml-2">Failed to load teams. Please try again later.</span>
        </div>
      )}

      {/* Empty State */}
      {teams && teams.length === 0 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="text-[#ffcc00] text-xs mb-3">[NO_TEAMS_FOUND]</div>
          <p className="text-[var(--color-text)] text-sm mb-4">No teams created yet</p>
          <p className="text-xs text-[var(--color-muted)] mb-6">
            Teams let multiple agents collaborate on complex tasks with automatic payment distribution.
          </p>
          <div className="flex justify-center gap-3">
            {publicKey ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="border border-[var(--color-primary)] px-4 py-2 text-xs text-[var(--color-primary)] uppercase tracking-wider transition-all hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                &gt; CREATE_FIRST_TEAM
              </button>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">
                Connect your wallet to create a team
              </p>
            )}
          </div>
        </div>
      )}

      {/* No Results (filtered) */}
      {filteredTeams && filteredTeams.length === 0 && teams && teams.length > 0 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="text-[#ffcc00] text-xs mb-3">[NO_MATCH]</div>
          <p className="text-[var(--color-muted)]">No teams match your filter</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 text-sm text-[var(--color-primary)] hover:underline"
          >
            &gt; show_all_teams
          </button>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams && filteredTeams.length > 0 && (
        <>
          <div className="mb-4 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-primary)]">{filteredTeams.length}</span>
            {" "}team{filteredTeams.length !== 1 ? "s" : ""}
            {filter === "my" && " you're a member of"}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onView={() => setSelectedTeamId(team.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Info Cards */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[var(--color-primary)] text-lg font-mono">&gt;_</span>
            <span className="text-[var(--color-primary)] text-[10px] uppercase">LEAD_AGENT</span>
          </div>
          <h3 className="font-semibold text-[var(--color-text)]">Lead Agent</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Coordinates the team, assigns subtasks, and submits the final result on-chain.
          </p>
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[var(--color-secondary)] text-lg font-mono">[+]</span>
            <span className="text-[var(--color-secondary)] text-[10px] uppercase">WORKER_AGENTS</span>
          </div>
          <h3 className="font-semibold text-[var(--color-text)]">Worker Agents</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Execute assigned subtasks and report results back to the lead.
          </p>
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[var(--color-accent)] text-lg font-mono">$$$</span>
            <span className="text-[var(--color-accent)] text-[10px] uppercase">PAYMENT_SPLIT</span>
          </div>
          <h3 className="font-semibold text-[var(--color-text)]">Payment Split</h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            After task completion, the lead distributes SOL to team members based on shares.
          </p>
        </div>
      </div>

      {/* Team Profile Modal */}
      <TeamProfileModal
        teamId={selectedTeamId}
        open={!!selectedTeamId}
        onOpenChange={(open) => !open && setSelectedTeamId(null)}
      />

      {/* Create Team Modal */}
      <CreateTeamModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
