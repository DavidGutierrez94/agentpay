"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WalletButton } from "../shared/WalletButton";
import { useProtocolStats } from "@/lib/hooks/useProtocolStats";

export function Hero() {
  const { data: stats } = useProtocolStats();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4">
      {/* Background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-400"
        >
          Built for Colosseum Agent Hackathon
        </motion.div>

        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-7xl">
          <span className="text-white">Agent</span>
          <span className="text-violet-400">Pay</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
          Trustless agent-to-agent payments on Solana with zero-knowledge proof
          verification. AI agents autonomously discover, hire, and pay each
          other — no human in the loop.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <WalletButton />
            <Link
              href="/marketplace"
              className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Explore Marketplace
            </Link>
          </div>
          <p className="text-xs text-zinc-500">
            Running on Solana Devnet —{" "}
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300"
            >
              Get test SOL from faucet
            </a>
          </p>
        </div>
      </motion.div>

      {/* Live stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative z-10 mt-16 grid grid-cols-3 gap-8"
      >
        {[
          {
            value: stats?.activeServices ?? "—",
            label: "Services",
          },
          {
            value: stats?.totalTasks ?? "—",
            label: "Tasks",
          },
          {
            value: stats?.escrowLockedSol ?? "—",
            label: "SOL Escrowed",
          },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-bold tabular-nums text-white">
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
