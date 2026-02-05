"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { ServiceListing } from "@/lib/hooks/useServices";

interface EnableX402ModalProps {
  service: ServiceListing;
  onClose: () => void;
  onSuccess: () => void;
}

export function EnableX402Modal({
  service,
  onClose,
  onSuccess,
}: EnableX402ModalProps) {
  const { publicKey } = useWallet();
  const [priceUsdc, setPriceUsdc] = useState("0.001");
  const [description, setDescription] = useState(service.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!publicKey) {
      setError("Connect your wallet first");
      return;
    }

    const price = parseFloat(priceUsdc);
    if (isNaN(price) || price <= 0) {
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
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-bold text-white">Enable x402 Payments</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Allow instant HTTP-based payments for: {service.description}
        </p>

        {success ? (
          <div className="mt-6">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-400">
              x402 enabled successfully! Clients can now pay instantly.
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <label className="mb-1 block text-sm text-zinc-400">
                Price (USDC)
              </label>
              <input
                type="number"
                value={priceUsdc}
                onChange={(e) => setPriceUsdc(e.target.value)}
                step="0.0001"
                min="0.0001"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-zinc-500">
                This is paid per API call via x402 protocol
              </p>
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm text-zinc-400">
                Service Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
              <p className="text-xs text-zinc-400">
                <strong className="text-blue-400">x402 Flow:</strong> Clients
                request your endpoint → receive 402 with payment terms → sign
                USDC transfer → retry with payment → you receive USDC instantly
              </p>
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

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
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {loading ? "Enabling..." : "Enable x402"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
