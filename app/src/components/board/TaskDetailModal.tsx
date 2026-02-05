"use client";

import { useState } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram } from "@/lib/program";
import { padBytes } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "../shared/StatusBadge";
import { ZKBadge } from "../shared/ZKBadge";
import { EscrowBadge } from "../shared/EscrowBadge";
import { DeadlineTimer } from "../shared/DeadlineTimer";
import { AddressDisplay } from "../shared/AddressDisplay";
import type { TaskRequest } from "@/lib/hooks/useTasks";

export function TaskDetailModal({
  task,
  onClose,
}: {
  task: TaskRequest;
  onClose: () => void;
}) {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isRequester = publicKey?.toBase58() === task.requester;
  const isProvider = publicKey?.toBase58() === task.provider;

  const handleAction = async (
    action: "accept" | "dispute" | "submit"
  ) => {
    if (!publicKey || !anchorWallet) return;
    setLoading(true);
    setError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const program = getProgram(anchorWallet) as any;

      if (action === "submit") {
        const encoded = new TextEncoder().encode(result);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoded.buffer as ArrayBuffer);
        const resultHash = Array.from(new Uint8Array(hashBuffer));
        await program.methods
          .submitResult(resultHash)
          .accounts({
            provider: publicKey,
            taskRequest: new PublicKey(task.pda),
          })
          .rpc();
        setSuccessMsg("Result submitted!");
      } else if (action === "accept") {
        await program.methods
          .acceptResult()
          .accounts({
            requester: publicKey,
            taskRequest: new PublicKey(task.pda),
            provider: new PublicKey(task.provider),
            serviceListing: new PublicKey(task.serviceListing),
          })
          .rpc();
        setSuccessMsg("Result accepted. Escrow released!");
      } else if (action === "dispute") {
        await program.methods
          .disputeTask()
          .accounts({
            requester: publicKey,
            taskRequest: new PublicKey(task.pda),
          })
          .rpc();
        setSuccessMsg("Task disputed. Refund issued.");
      }

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
      <div className="mx-4 w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            &times;
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            {task.zkVerified && <ZKBadge />}
            <EscrowBadge sol={task.amountSol} />
          </div>

          <p className="text-sm text-zinc-300">{task.description}</p>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
            <div>
              Requester: <AddressDisplay address={task.requester} />
            </div>
            <div>
              Provider: <AddressDisplay address={task.provider} />
            </div>
            <div>
              Deadline:{" "}
              {task.status === "open" || task.status === "submitted" ? (
                <DeadlineTimer deadlineTs={task.deadlineTs} />
              ) : (
                task.deadline
              )}
            </div>
            <div className="font-mono">
              PDA: <AddressDisplay address={task.pda} />
            </div>
          </div>

          {task.resultHash && (
            <div className="rounded-lg bg-zinc-800 p-3">
              <p className="text-xs text-zinc-500">Result Hash</p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-300">
                {task.resultHash}
              </p>
            </div>
          )}
        </div>

        {successMsg ? (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-400">
            {successMsg}
          </div>
        ) : (
          <>
            {/* Provider: submit result */}
            {isProvider && task.status === "open" && (
              <div className="mt-4">
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Enter your result..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
                <button
                  onClick={() => handleAction("submit")}
                  disabled={loading || !result.trim()}
                  className="mt-2 w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Result"}
                </button>
              </div>
            )}

            {/* Requester: accept or dispute */}
            {isRequester && task.status === "submitted" && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleAction("dispute")}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-red-500/30 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Dispute
                </button>
                <button
                  onClick={() => handleAction("accept")}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Accept & Pay"}
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
