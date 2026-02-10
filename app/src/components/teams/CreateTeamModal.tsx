"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { type CreateTeamParams, useCreateTeam } from "@/lib/hooks/useTeams";

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTeamModal({ open, onOpenChange, onSuccess }: CreateTeamModalProps) {
  const { publicKey } = useWallet();
  const createTeam = useCreateTeam();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<
    { wallet: string; role: string; level: number; sharePercentage: number }[]
  >([]);
  const [newMemberWallet, setNewMemberWallet] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("worker");
  const [newMemberLevel, setNewMemberLevel] = useState(2);
  const [newMemberShare, setNewMemberShare] = useState(20);

  const handleAddMember = () => {
    if (!newMemberWallet || newMemberWallet.length < 32) return;

    // Check if member already exists
    if (members.some((m) => m.wallet === newMemberWallet)) return;

    setMembers([
      ...members,
      {
        wallet: newMemberWallet,
        role: newMemberRole,
        level: newMemberLevel,
        sharePercentage: newMemberShare,
      },
    ]);

    // Reset form
    setNewMemberWallet("");
    setNewMemberRole("worker");
    setNewMemberLevel(2);
    setNewMemberShare(20);
  };

  const handleRemoveMember = (wallet: string) => {
    setMembers(members.filter((m) => m.wallet !== wallet));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) return;

    const params: CreateTeamParams = {
      name,
      leadWallet: publicKey.toBase58(),
      description: description || undefined,
      members: members.map((m) => ({
        wallet: m.wallet,
        role: m.role as "worker" | "backend" | "frontend" | "researcher" | "reviewer",
        level: m.level as 1 | 2 | 3 | 4,
        skills: [],
        sharePercentage: m.sharePercentage,
      })),
    };

    try {
      await createTeam.mutateAsync(params);
      onSuccess?.();
      onOpenChange(false);
    } catch (_error) {
      // Error handled by mutation
    }
  };

  const totalShare = members.reduce((sum, m) => sum + m.sharePercentage, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader label="CREATE_TEAM">
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Wallet Analysis Squad"
              className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              style={{ borderRadius: "var(--border-radius-sm)" }}
              required
              maxLength={64}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team do?"
              rows={2}
              className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              style={{ borderRadius: "var(--border-radius-sm)" }}
              maxLength={256}
            />
          </div>

          {/* Lead Wallet */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Lead Wallet (You)
            </label>
            <div
              className="border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 px-4 py-2"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <span className="mr-2">👑</span>
              <span className="font-mono text-sm text-[var(--color-warning)]">
                {publicKey?.toBase58().slice(0, 8)}...
                {publicKey?.toBase58().slice(-6)}
              </span>
            </div>
          </div>

          {/* Add Team Members */}
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--color-muted)] uppercase tracking-wider">
              Add Team Members
            </label>
            <div
              className="space-y-2 border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <input
                type="text"
                value={newMemberWallet}
                onChange={(e) => setNewMemberWallet(e.target.value)}
                placeholder="Member wallet address"
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <option value="worker">Worker</option>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="researcher">Researcher</option>
                  <option value="reviewer">Reviewer</option>
                </select>
                <select
                  value={newMemberLevel}
                  onChange={(e) => setNewMemberLevel(Number(e.target.value))}
                  className="border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <option value={1}>L1 Observer</option>
                  <option value={2}>L2 Advisor</option>
                  <option value={3}>L3 Operator</option>
                  <option value={4}>L4 Autonomous</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    value={newMemberShare}
                    onChange={(e) => setNewMemberShare(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)]">
                    %
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!newMemberWallet || newMemberWallet.length < 32}
                className="w-full bg-[var(--color-surface)] py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                + Add Member
              </button>
            </div>
          </div>

          {/* Current Members */}
          {members.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-muted)]">
                  Team Members ({members.length})
                </span>
                <span
                  className={`text-xs ${
                    totalShare > 100 ? "text-[var(--color-error)]" : "text-[var(--color-muted)]"
                  }`}
                >
                  Total share: {totalShare}%
                </span>
              </div>
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.wallet}
                    className="flex items-center gap-2 bg-[var(--color-surface)] px-3 py-2"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  >
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {member.wallet.slice(0, 6)}...
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">{member.role}</span>
                    <span className="text-xs text-[var(--color-muted)]">L{member.level}</span>
                    <span className="text-xs text-[var(--color-muted)]">
                      {member.sharePercentage}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.wallet)}
                      className="ml-auto text-[var(--color-error)] hover:text-[var(--color-error)]/80"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 border border-[var(--color-border)] py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !publicKey || createTeam.isPending}
              className="flex-1 bg-[var(--color-primary)] py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              {createTeam.isPending ? "Creating..." : "Create Team"}
            </button>
          </div>

          {createTeam.isError && (
            <p className="text-center text-sm text-[var(--color-error)]">
              Failed to create team. Please try again.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
