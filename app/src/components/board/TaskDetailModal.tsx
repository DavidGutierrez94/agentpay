"use client";

import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { TaskRequest } from "@/lib/hooks/useTasks";
import { getProgram } from "@/lib/program";
import { AddressDisplay } from "../shared/AddressDisplay";
import { DeadlineTimer } from "../shared/DeadlineTimer";
import { EscrowBadge } from "../shared/EscrowBadge";
import { StatusBadge } from "../shared/StatusBadge";
import { ZKBadge } from "../shared/ZKBadge";

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
}: {
  task: TaskRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isRequester = publicKey?.toBase58() === task?.requester;
  const isProvider = publicKey?.toBase58() === task?.provider;

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setResult("");
      setError("");
      setSuccessMsg("");
    }, 200);
  };

  const handleAction = async (action: "accept" | "dispute" | "submit") => {
    if (!task) return;
    if (!publicKey || !anchorWallet) {
      setError("Please connect your wallet first");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");
    // console.log(`[TaskDetailModal] Executing ${action} on task ${task.pda}`);
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
      console.error(`[TaskDetailModal] ${action} failed:`, err);
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader label="TASK_DETAILS">
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            {task.zkVerified && <ZKBadge />}
            <EscrowBadge sol={task.amountSol} />
          </div>

          {/* Description */}
          <div
            className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            <p className="text-sm text-[var(--color-text)] font-mono">{task.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <span className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                requester
              </span>
              <div className="mt-1">
                <AddressDisplay address={task.requester} chars={6} />
              </div>
            </div>
            <div
              className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <span className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                provider
              </span>
              <div className="mt-1">
                <AddressDisplay address={task.provider} chars={6} />
              </div>
            </div>
            <div
              className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <span className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                deadline
              </span>
              <div className="mt-1">
                {task.status === "open" || task.status === "submitted" ? (
                  <DeadlineTimer deadlineTs={task.deadlineTs} />
                ) : (
                  <span className="text-sm text-[var(--color-text)]">{task.deadline}</span>
                )}
              </div>
            </div>
            <div
              className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <span className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                pda
              </span>
              <div className="mt-1">
                <AddressDisplay address={task.pda} chars={6} />
              </div>
            </div>
          </div>

          {/* Result Hash */}
          {task.resultHash && (
            <div
              className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              <span className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wider">
                result_hash
              </span>
              <p className="mt-1 break-all font-mono text-xs text-[var(--color-text)]">
                {task.resultHash}
              </p>
            </div>
          )}
        </div>

        {successMsg ? (
          <div
            className="mt-4 border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            [SUCCESS] {successMsg}
          </div>
        ) : (
          <>
            {/* Provider: submit result */}
            {isProvider && task.status === "open" && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                    submit_result
                  </label>
                  <textarea
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    placeholder="Enter your result..."
                    rows={2}
                    className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none font-mono"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  />
                </div>
                <button
                  onClick={() => handleAction("submit")}
                  disabled={loading || !result.trim()}
                  className="w-full border border-[var(--color-primary)] bg-[var(--color-primary)] py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-transparent hover:text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  {loading ? "Submitting..." : "> SUBMIT_RESULT"}
                </button>
              </div>
            )}

            {/* Requester: accept or dispute */}
            {isRequester && task.status === "submitted" && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleAction("dispute")}
                  disabled={loading}
                  className="flex-1 border border-[var(--color-error)]/50 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-50 transition-colors"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  {loading ? "Processing..." : "> DISPUTE"}
                </button>
                <button
                  onClick={() => handleAction("accept")}
                  disabled={loading}
                  className="flex-1 border border-[var(--color-success)] bg-[var(--color-success)] py-2 text-sm font-medium text-[var(--color-bg)] hover:bg-transparent hover:text-[var(--color-success)] disabled:opacity-50 transition-colors"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  {loading ? "Processing..." : "> ACCEPT_&_PAY"}
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div
            className="mt-3 border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            [ERROR] {error}
          </div>
        )}

        <DialogFooter className="mt-6">
          <button
            onClick={handleClose}
            className="w-full border border-[var(--color-border)] py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
