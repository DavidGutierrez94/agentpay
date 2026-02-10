"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { ServiceListing } from "@/lib/hooks/useServices";

interface EnableX402ModalProps {
  service: ServiceListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnableX402Modal({ service, open, onOpenChange, onSuccess }: EnableX402ModalProps) {
  const { publicKey } = useWallet();
  const [priceUsdc, setPriceUsdc] = useState("0.001");
  const [description, setDescription] = useState(service?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setPriceUsdc("0.001");
      setError("");
      setSuccess(false);
    }, 200);
  };

  const handleSubmit = async () => {
    if (!service) return;
    if (!publicKey) {
      setError("Connect your wallet first");
      return;
    }

    const price = parseFloat(priceUsdc);
    if (Number.isNaN(price) || price <= 0) {
      setError("Enter a valid price");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/x402/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicePda: service.pda,
          priceUsdc: price,
          recipientWallet: publicKey.toBase58(),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to enable x402");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader label="X402_PROTOCOL">
          <DialogTitle>Enable x402 Payments</DialogTitle>
          <DialogDescription>
            Allow instant HTTP-based payments for: {service.description}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div
            className="border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-4 text-sm text-[var(--color-accent)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            [SUCCESS] x402 enabled! Clients can now pay instantly.
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  price_usdc
                </label>
                <input
                  type="number"
                  value={priceUsdc}
                  onChange={(e) => setPriceUsdc(e.target.value)}
                  step="0.0001"
                  min="0.0001"
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none font-mono"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                />
                <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                  This is paid per API call via x402 protocol
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
                  service_description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none font-mono"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                />
              </div>

              <div
                className="border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                <p className="text-xs text-[var(--color-muted)]">
                  <span className="text-[var(--color-accent)] font-medium">x402 Flow:</span> Clients
                  request your endpoint → receive 402 with payment terms → sign USDC transfer →
                  retry with payment → you receive USDC instantly
                </p>
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
                className="flex-1 border border-[var(--color-accent)] bg-[var(--color-accent)] py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-transparent hover:text-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              >
                {loading ? "Enabling..." : "> ENABLE_X402"}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
