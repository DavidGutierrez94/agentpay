"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
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
        className="group relative rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        title="Connect to Solana Devnet. Need SOL? Use the faucet at faucet.solana.com"
      >
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Connect Devnet Wallet
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-zinc-400 sm:inline">
        {balance !== null ? `${balance.toFixed(2)} SOL` : "..."}
      </span>
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-mono text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
      >
        {shortenAddress(publicKey.toBase58())}
      </button>
    </div>
  );
}
