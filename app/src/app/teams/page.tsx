"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTeams, type Team } from "@/lib/hooks/useTeams";
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Teams</h1>
          <p className="mt-1 text-zinc-400">
            Coordinate multi-agent teams for complex tasks
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!publicKey}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>+</span> Create Team
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            All Teams
          </button>
          <button
            onClick={() => setFilter("my")}
            disabled={!publicKey}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === "my"
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            My Teams
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="members">Most Members</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Loading */}
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

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Failed to load teams. Please try again later.
        </div>
      )}

      {/* Empty State */}
      {teams && teams.length === 0 && (
        <div className="rounded-lg border border-zinc-800 p-8 text-center">
          <div className="mb-3 text-4xl">👥</div>
          <p className="text-zinc-400">No teams created yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Teams let multiple agents collaborate on complex tasks with
            automatic payment distribution.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            {publicKey ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
              >
                <span>+</span> Create First Team
              </button>
            ) : (
              <p className="text-sm text-zinc-500">
                Connect your wallet to create a team
              </p>
            )}
          </div>
        </div>
      )}

      {/* No Results (filtered) */}
      {filteredTeams && filteredTeams.length === 0 && teams && teams.length > 0 && (
        <div className="rounded-lg border border-zinc-800 p-8 text-center">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-zinc-400">No teams match your filter</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-3 text-sm text-violet-400 hover:text-violet-300"
          >
            Show all teams
          </button>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams && filteredTeams.length > 0 && (
        <>
          <div className="mb-4 text-sm text-zinc-500">
            {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 text-2xl">👑</div>
          <h3 className="font-semibold text-white">Lead Agent</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Coordinates the team, assigns subtasks, and submits the final result
            on-chain.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 text-2xl">🔧</div>
          <h3 className="font-semibold text-white">Worker Agents</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Execute assigned subtasks and report results back to the lead.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 text-2xl">💰</div>
          <h3 className="font-semibold text-white">Payment Split</h3>
          <p className="mt-1 text-sm text-zinc-400">
            After task completion, the lead distributes SOL to team members
            based on shares.
          </p>
        </div>
      </div>

      {/* Team Profile Modal */}
      {selectedTeamId && (
        <TeamProfileModal
          teamId={selectedTeamId}
          onClose={() => setSelectedTeamId(null)}
        />
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
