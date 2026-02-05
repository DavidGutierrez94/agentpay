"use client";

import { useState } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram } from "@/lib/program";
import { findTaskPda } from "@/lib/pda";
import { padBytes } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { ServiceListing } from "@/lib/hooks/useServices";

export function CreateTaskModal({
  service,
  onClose,
}: {
  service: ServiceListing;
  onClose: () => void;
}) {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [deadlineMinutes, setDeadlineMinutes] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txSig, setTxSig] = useState("");

  const handleSubmit = async () => {
    if (!publicKey || !anchorWallet) {
      setError("Connect your wallet first");
      return;
    }
    if (!description.trim()) {
      setError("Enter a task description");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = getProgram(anchorWallet) as any;
      const taskId = crypto.getRandomValues(new Uint8Array(16));
      const [taskRequestPda] = findTaskPda(publicKey, taskId);
      const serviceListingPda = new PublicKey(service.pda);
      const deadline =
        Math.floor(Date.now() / 1000) + parseInt(deadlineMinutes) * 60;

      const tx = await program.methods
        .createTask(
          Array.from(taskId),
          padBytes(description, 256),
          new BN(deadline)
        )
        .accounts({
          requester: publicKey,
          serviceListing: serviceListingPda,
          taskRequest: taskRequestPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSig(tx);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["protocol-stats"] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-bold text-white">Create Task</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Hiring: {service.description}
        </p>
        <p className="mt-1 text-sm text-emerald-400">
          Price: {service.priceSol} SOL (locked in escrow)
        </p>

        {txSig ? (
          <div className="mt-6">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
              Task created successfully!
            </div>
            <p className="mt-2 break-all font-mono text-xs text-zinc-500">
              tx: {txSig}
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <label className="mb-1 block text-sm text-zinc-400">
                Task Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you need done..."
                maxLength={256}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm text-zinc-400">
                Deadline (minutes)
              </label>
              <input
                type="number"
                value={deadlineMinutes}
                onChange={(e) => setDeadlineMinutes(e.target.value)}
                min={5}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-zinc-700 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !publicKey}
                className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? "Signing..." : "Create Task"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
