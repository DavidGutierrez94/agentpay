"use client";

import { useTeam } from "@/lib/hooks/useTeams";
import { AddressDisplay } from "../shared/AddressDisplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

const roleIcons: Record<string, string> = {
  lead: "👑",
  backend: "⚙️",
  frontend: "🎨",
  researcher: "🔍",
  reviewer: "📋",
  worker: "🔧",
};

const levelBadges: Record<number, { label: string; name: string; color: string }> = {
  1: { label: "L1", name: "Observer", color: "bg-[var(--color-muted)]" },
  2: { label: "L2", name: "Advisor", color: "bg-[var(--color-info)]" },
  3: { label: "L3", name: "Operator", color: "bg-[var(--color-primary)]" },
  4: { label: "L4", name: "Autonomous", color: "bg-[var(--color-warning)]" },
};

const statusColors: Record<string, string> = {
  planning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  in_progress: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
  review: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  submitted: "bg-[var(--color-info)]/10 text-[var(--color-info)]",
  completed: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  failed: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
};

interface TeamProfileModalProps {
  teamId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamProfileModal({ teamId, open, onOpenChange }: TeamProfileModalProps) {
  const { data: team, isLoading, error } = useTeam(teamId || "");

  if (!teamId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader label="TEAM_PROFILE">
          <DialogTitle>Team Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading && (
            <div className="flex h-48 items-center justify-center">
              <div className="animate-spin text-2xl">⏳</div>
            </div>
          )}

          {error && (
            <div 
              className="border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-4 text-sm text-[var(--color-error)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              Failed to load team details.
            </div>
          )}

          {team && (
            <>
              {/* Header */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">👥</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text-bright)]">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-[var(--color-muted)]">{team.description}</p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div 
                  className="bg-[var(--color-surface)] p-3 text-center"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <div className="text-2xl font-bold text-[var(--color-text-bright)]">
                    {team.stats.totalTasks}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">Total Tasks</div>
                </div>
                <div 
                  className="bg-[var(--color-surface)] p-3 text-center"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <div className="text-2xl font-bold text-[var(--color-success)]">
                    {team.stats.completedTasks}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">Completed</div>
                </div>
                <div 
                  className="bg-[var(--color-surface)] p-3 text-center"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <div className="text-2xl font-bold text-[var(--color-info)]">
                    {team.stats.inProgressTasks}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">In Progress</div>
                </div>
                <div 
                  className="bg-[var(--color-surface)] p-3 text-center"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <div className="text-2xl font-bold text-[var(--color-primary)]">
                    {team.members.length}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">Members</div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Team Members
                </h3>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div
                      key={member.wallet}
                      className={`flex items-center gap-3 p-3 ${
                        member.role === "lead"
                          ? "bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20"
                          : "bg-[var(--color-surface)]"
                      }`}
                      style={{ borderRadius: "var(--border-radius-sm)" }}
                    >
                      <span className="text-lg">
                        {roleIcons[member.role] || "🔧"}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AddressDisplay address={member.wallet} chars={6} />
                          <span
                            className={`px-1.5 py-0.5 text-xs text-[var(--color-bg)] ${
                              levelBadges[member.level]?.color || "bg-[var(--color-muted)]"
                            }`}
                            style={{ borderRadius: "var(--border-radius-sm)" }}
                          >
                            {levelBadges[member.level]?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--color-muted)]">
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
                              className="bg-[var(--color-border)] px-1.5 py-0.5 text-xs text-[var(--color-text)]"
                              style={{ borderRadius: "var(--border-radius-sm)" }}
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
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Recent Tasks
                  </h3>
                  <div className="space-y-2">
                    {team.recentTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between bg-[var(--color-surface)] p-3"
                        style={{ borderRadius: "var(--border-radius-sm)" }}
                      >
                        <div className="flex-1">
                          <p className="text-sm text-[var(--color-text-bright)]">{task.description}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-muted)]">
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
                          className={`px-2 py-0.5 text-xs ${
                            statusColors[task.status] || "bg-[var(--color-muted)] text-[var(--color-text)]"
                          }`}
                          style={{ borderRadius: "var(--border-radius-sm)" }}
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
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Shared Context
                  </h3>
                  <div 
                    className="bg-[var(--color-surface)] p-4"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  >
                    <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-[var(--color-muted)] font-mono">
                      {team.context}
                    </pre>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <div className="text-xs text-[var(--color-muted)]">
                  Created {new Date(team.createdAt).toLocaleDateString()}
                  {team.updatedAt && (
                    <> • Updated {new Date(team.updatedAt).toLocaleDateString()}</>
                  )}
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)]"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
