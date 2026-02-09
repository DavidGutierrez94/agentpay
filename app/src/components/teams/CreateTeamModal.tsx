"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateTeam, type CreateTeamParams } from "@/lib/hooks/useTeams";

interface CreateTeamModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTeamModal({ onClose, onSuccess }: CreateTeamModalProps) {
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
      onClose();
    } catch (error) {
      console.error("Failed to create team:", error);
    }
  };

  const totalShare = members.reduce((sum, m) => sum + m.sharePercentage, 0);

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
          className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-zinc-500 hover:text-white"
          >
            ✕
          </button>

          <h2 className="mb-6 text-xl font-bold text-white">Create New Team</h2>

          <form onSubmit={handleSubmit}>
            {/* Team Name */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Team Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wallet Analysis Squad"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                required
                maxLength={64}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this team do?"
                rows={2}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                maxLength={256}
              />
            </div>

            {/* Lead Wallet */}
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Lead Wallet (You)
              </label>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2">
                <span className="mr-2">👑</span>
                <span className="font-mono text-sm text-amber-400">
                  {publicKey?.toBase58().slice(0, 8)}...
                  {publicKey?.toBase58().slice(-6)}
                </span>
              </div>
            </div>

            {/* Add Team Members */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Add Team Members
              </label>
              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                <input
                  type="text"
                  value={newMemberWallet}
                  onChange={(e) => setNewMemberWallet(e.target.value)}
                  placeholder="Member wallet address"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
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
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
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
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                      %
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!newMemberWallet || newMemberWallet.length < 32}
                  className="w-full rounded-lg bg-zinc-700 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add Member
                </button>
              </div>
            </div>

            {/* Current Members */}
            {members.length > 0 && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">
                    Team Members ({members.length})
                  </span>
                  <span
                    className={`text-xs ${
                      totalShare > 100 ? "text-red-400" : "text-zinc-500"
                    }`}
                  >
                    Total share: {totalShare}%
                  </span>
                </div>
                <div className="space-y-1">
                  {members.map((member) => (
                    <div
                      key={member.wallet}
                      className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2"
                    >
                      <span className="font-mono text-xs text-zinc-400">
                        {member.wallet.slice(0, 6)}...
                      </span>
                      <span className="text-xs text-zinc-500">{member.role}</span>
                      <span className="text-xs text-zinc-500">L{member.level}</span>
                      <span className="text-xs text-zinc-500">
                        {member.sharePercentage}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.wallet)}
                        className="ml-auto text-red-400 hover:text-red-300"
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
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name || !publicKey || createTeam.isPending}
                className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createTeam.isPending ? "Creating..." : "Create Team"}
              </button>
            </div>

            {createTeam.isError && (
              <p className="mt-3 text-center text-sm text-red-400">
                Failed to create team. Please try again.
              </p>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
