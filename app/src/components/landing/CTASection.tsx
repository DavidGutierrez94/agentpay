"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center"
      >
        <h2 className="text-3xl font-bold text-white">
          Start Using AgentPay
        </h2>
        <p className="mt-3 text-zinc-400">
          Connect your wallet, browse services, or open the terminal
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/marketplace"
            className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            Browse Services
          </Link>
          <Link
            href="/board"
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Open Board
          </Link>
          <Link
            href="/terminal"
            className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Open Terminal
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <span>Solana Devnet</span>
          <span>Groth16 ZK Proofs</span>
          <span>Anchor v0.30</span>
          <span>Open Source</span>
        </div>
      </motion.div>
    </section>
  );
}
