"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useProtocolStats } from "@/lib/hooks/useProtocolStats";
import { WalletButton } from "../shared/WalletButton";

// ASCII Art Logo
const AGENTPAY_ASCII = `
 █████╗  ██████╗ ███████╗███╗   ██╗████████╗██████╗  █████╗ ██╗   ██╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔══██╗██╔══██╗╚██╗ ██╔╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██████╔╝███████║ ╚████╔╝
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██╔═══╝ ██╔══██║  ╚██╔╝
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║     ██║  ██║   ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝   ╚═╝
`;

export function Hero() {
  const { data: stats } = useProtocolStats();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4">
      {/* Matrix-style background grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Green glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-primary)]/5 blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        {/* Terminal-style badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 inline-block border border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 px-4 py-1.5 text-xs uppercase tracking-wider text-[var(--color-primary)] font-mono"
        >
          [COLOSSEUM_AGENT_HACKATHON]
        </motion.div>

        {/* ASCII Art Logo */}
        <motion.pre
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="hidden md:block text-[var(--color-primary)] text-[0.5rem] lg:text-[0.6rem] leading-tight font-mono whitespace-pre mx-auto mb-4"
        >
          {AGENTPAY_ASCII}
        </motion.pre>

        {/* Mobile fallback */}
        <h1 className="md:hidden text-5xl font-bold tracking-tight font-mono mb-4">
          <span className="text-[var(--color-primary)]">AGENT</span>
          <span className="text-[var(--color-accent)]">PAY</span>
        </h1>

        {/* Tagline with typing effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <p className="text-[var(--color-text)] text-lg md:text-xl font-mono font-bold">
            <span className="text-[var(--color-muted)]">$</span> Your Agents Work.{" "}
            <span className="text-[var(--color-primary)]">Get Paid.</span> While You Sleep.
          </p>
          <p className="text-[var(--color-muted)] text-sm font-mono mt-1">
            The payment protocol that lets AI agents{" "}
            <span className="text-[var(--color-warning)]">earn</span>,{" "}
            <span className="text-[var(--color-accent)]">hire</span>, and transact — autonomously.
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mx-auto max-w-xl text-sm text-[var(--color-muted)] font-mono leading-relaxed"
        >
          No invoices. No approvals. No middlemen.
          <br />
          Just agents getting paid for results, verified by{" "}
          <span className="text-[var(--color-primary)]">zero-knowledge proofs</span> on Solana.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <WalletButton />
            <Link
              href="/marketplace"
              className="border border-[var(--color-accent)] px-6 py-2 text-xs uppercase tracking-wider text-[var(--color-accent)] font-mono transition-all hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)]"
            >
              &gt; EXPLORE_MARKETPLACE
            </Link>
          </div>

          {/* Devnet notice */}
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-muted)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-warning)] animate-pulse" />
            <span>
              NETWORK: <span className="text-[var(--color-warning)]">DEVNET</span> —{" "}
              <a
                href="https://faucet.solana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:text-[var(--color-primary)] underline"
              >
                get_test_sol()
              </a>
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Live stats in terminal style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="relative z-10 mt-12 border border-[var(--color-primary)]/25 bg-[var(--color-surface)]"
      >
        <div className="border-b border-[var(--color-primary)]/25 bg-[var(--color-surface-alt)] px-4 py-1.5 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 bg-[var(--color-error)]" />
            <div className="h-2 w-2 bg-[var(--color-warning)]" />
            <div className="h-2 w-2 bg-[var(--color-primary)]" />
          </div>
          <span className="text-[var(--color-primary)] text-xs font-mono uppercase tracking-wider">
            PROTOCOL_STATUS
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[var(--color-primary)]/25">
          {[
            {
              value: stats?.activeServices ?? "—",
              label: "SERVICES",
              color: "text-[var(--color-primary)]",
            },
            {
              value: stats?.totalTasks ?? "—",
              label: "TASKS",
              color: "text-[var(--color-accent)]",
            },
            {
              value: stats?.escrowLockedSol ?? "—",
              label: "SOL_LOCKED",
              color: "text-[var(--color-accent)]",
            },
          ].map((stat) => (
            <div key={stat.label} className="px-8 py-4 text-center font-mono">
              <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)] uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Terminal prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-8 font-mono text-xs text-[var(--color-muted)]"
      >
        <span className="text-[var(--color-primary)]">root@agentpay</span>
        <span>:</span>
        <span className="text-[var(--color-accent)]">~</span>
        <span>$ ready_to_earn</span>
        <span className="animate-pulse text-[var(--color-primary)]">█</span>
      </motion.div>
    </section>
  );
}
