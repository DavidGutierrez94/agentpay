"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTeam } from "@/lib/hooks/useTeams";
import { AddressDisplay } from "../shared/AddressDisplay";

const roleIcons: Record<string, string> = {
  lead: "👑",
  backend: "⚙️",
  frontend: "🎨",
  researcher: "🔍",
  reviewer: "📋",
  worker: "🔧",
};

const levelBadges: Record<number, { label: string; name: string; color: string }> = {
  1: { label: "L1", name: "Observer", color: "bg-zinc-600" },
  2: { label: "L2", name: "Advisor", color: "bg-blue-600" },
  3: { label: "L3", name: "Operator", color: "bg-violet-600" },
  4: { label: "L4", name: "Autonomous", color: "bg-amber-600" },
};

const statusColors: Record<string, string> = {
  planning: "bg-yellow-500/10 text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  review: "bg-violet-500/10 text-violet-400",
  submitted: "bg-cyan-500/10 text-cyan-400",
  completed: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
};

interface TeamProfileModalProps {
  teamId: string;
  onClose: () => void;
}

export function TeamProfileModal({ teamId, onClose }: TeamProfileModalProps) {
  const { data: team, isLoading, error } = useTeam(teamId);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-zinc-500 hover:text-white"
          >
            ✕
          </button>

          {isLoading && (
            <div className="flex h-48 items-center justify-center">
              <div className="animate-spin text-2xl">⏳</div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
              Failed to load team details.
            </div>
          )}

          {team && (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👥</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{team.name}</h2>
                    {team.description && (
                      <p className="text-sm text-zinc-400">{team.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {team.stats.totalTasks}
                  </div>
                  <div className="text-xs text-zinc-500">Total Tasks</div>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {team.stats.completedTasks}
                  </div>
                  <div className="text-xs text-zinc-500">Completed</div>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {team.stats.inProgressTasks}
                  </div>
                  <div className="text-xs text-zinc-500">In Progress</div>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                  <div className="text-2xl font-bold text-violet-400">
                    {team.members.length}
                  </div>
                  <div className="text-xs text-zinc-500">Members</div>
                </div>
              </div>

              {/* Team Members */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Team Members
                </h3>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.wallet}
                      className={`flex items-center gap-3 rounded-lg p-3 ${
                        member.role === "lead"
                          ? "bg-amber-500/5 border border-amber-500/20"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      <span className="text-lg">
                        {roleIcons[member.role] || "🔧"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AddressDisplay address={member.wallet} chars={6} />
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs text-white ${
                              levelBadges[member.level]?.color || "bg-zinc-600"
                            }`}
                          >
                            {levelBadges[member.level]?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          {member.sharePercentage > 0 &&
                            ` • ${member.sharePercentage}% share`}
                        </div>
                      </div>
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {member.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-zinc-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Tasks */}
              {team.recentTasks && team.recentTasks.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                    Recent Tasks
                  </h3>
                  <div className="space-y-2">
                    {team.recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-white">{task.description}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                            <span>
                              {task.completedSubtasks}/{task.subtaskCount} subtasks
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            statusColors[task.status] || "bg-zinc-600 text-zinc-300"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Context Preview */}
              {team.context && (
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                    Shared Context
                  </h3>
                  <div className="rounded-lg bg-zinc-800/50 p-4">
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-zinc-400 font-mono">
                      {team.context}
                    </pre>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div className="text-xs text-zinc-500">
                  Created {new Date(team.createdAt).toLocaleDateString()}
                  {team.updatedAt && (
                    <> • Updated {new Date(team.updatedAt).toLocaleDateString()}</>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
