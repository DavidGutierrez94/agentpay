"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { shortenAddress } from "@/lib/utils";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!publicKey) {
      // Clear balance asynchronously to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => setBalance(null), 0);
      return () => clearTimeout(timeoutId);
    }
    let cancelled = false;
    const fetchBalance = async () => {
      const bal = await connection.getBalance(publicKey);
      if (!cancelled) setBalance(bal / LAMPORTS_PER_SOL);
    };
    fetchBalance();
    const id = setInterval(fetchBalance, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [publicKey, connection]);

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="group relative rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:opacity-90"
        title="Connect to Solana Devnet. Need SOL? Use the faucet at faucet.solana.com"
      >
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success)]" />
          Connect Devnet Wallet
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-[var(--color-text-dim)] sm:inline">
        {balance !== null ? `${balance.toFixed(2)} SOL` : "..."}
      </span>
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-mono text-[var(--color-text)] transition-colors hover:border-[var(--color-border-bright)] hover:text-[var(--color-text-bright)]"
      >
        {shortenAddress(publicKey.toBase58())}
      </button>
    </div>
  );
}
