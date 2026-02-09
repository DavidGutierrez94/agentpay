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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";

export function CreateTaskModal({
  service,
  open,
  onOpenChange,
}: {
  service: ServiceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [deadlineMinutes, setDeadlineMinutes] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txSig, setTxSig] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing
    setTimeout(() => {
      setDescription("");
      setDeadlineMinutes("60");
      setError("");
      setTxSig("");
    }, 200);
  };

  const handleSubmit = async () => {
    if (!publicKey || !anchorWallet) {
      setError("Connect your wallet first");
      return;
    }
    if (!description.trim()) {
      setError("Enter a task description");
      return;
    }

    if (!service) {
      setError("No service selected");
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

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader label="NEW_TASK">
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Hiring: {service.description}
          </DialogDescription>
        </DialogHeader>

        <div
          className="inline-flex items-center gap-2 border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1.5 text-sm font-mono text-[var(--color-primary)]"
          style={{ borderRadius: "var(--border-radius-sm)" }}
        >
          <span className="text-[var(--color-muted)] uppercase text-xs">escrow:</span>
          {service.priceSol} SOL
        </div>

        {txSig ? (
          <div className="mt-4 space-y-4">
            <div
              className="border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4 text-sm text-[var(--color-success)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              [SUCCESS] Task created successfully!
            </div>
            <p className="break-all font-mono text-xs text-[var(--color-muted)]">
              tx: {txSig}
            </p>
            <button
              onClick={handleClose}
              className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  task_description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you need done..."
                  maxLength={256}
                  rows={3}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none font-mono"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  deadline_minutes
                </label>
                <input
                  type="number"
                  value={deadlineMinutes}
                  onChange={(e) => setDeadlineMinutes(e.target.value)}
                  min={5}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none font-mono"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                />
              </div>

              {error && (
                <div
                  className="border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-sm text-[var(--color-error)]"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  [ERROR] {error}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <button
                onClick={handleClose}
                className="flex-1 border border-[var(--color-border)] py-2 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !publicKey}
                className="flex-1 border border-[var(--color-primary)] bg-[var(--color-primary)] py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-transparent hover:text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                {loading ? "Signing..." : "> CREATE_TASK"}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
