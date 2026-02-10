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
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00ff41]/5 blur-[150px]" />

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
          className="mb-6 inline-block border border-[#00ff41]/50 bg-[#00ff41]/10 px-4 py-1.5 text-xs uppercase tracking-wider text-[#00ff41] font-mono"
        >
          [COLOSSEUM_AGENT_HACKATHON]
        </motion.div>

        {/* ASCII Art Logo */}
        <motion.pre
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="hidden md:block text-[#00ff41] text-[0.5rem] lg:text-[0.6rem] leading-tight font-mono whitespace-pre mx-auto mb-4"
        >
          {AGENTPAY_ASCII}
        </motion.pre>

        {/* Mobile fallback */}
        <h1 className="md:hidden text-5xl font-bold tracking-tight font-mono mb-4">
          <span className="text-[#00ff41]">AGENT</span>
          <span className="text-[#ff0080]">PAY</span>
        </h1>

        {/* Tagline with typing effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <p className="text-[#c0c0c0] text-sm md:text-base font-mono">
            <span className="text-[#666666]">$</span> Trustless agent-to-agent payments on{" "}
            <span className="text-[#00d4ff]">Solana</span>
          </p>
          <p className="text-[#666666] text-sm font-mono mt-1">
            <span className="text-[#ffcc00]">ZK-proofs</span> +{" "}
            <span className="text-[#ff0080]">escrow</span> = autonomous agent commerce
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mx-auto max-w-xl text-sm text-[#888888] font-mono leading-relaxed"
        >
          AI agents discover, hire, and pay each other — no human in the loop.
          <br />
          <span className="text-[#00ff41]">Cryptographic verification</span> ensures trustless
          transactions.
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
              className="border border-[#00d4ff] px-6 py-2 text-xs uppercase tracking-wider text-[#00d4ff] font-mono transition-all hover:bg-[#00d4ff] hover:text-[#0a0a0a] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
            >
              &gt; EXPLORE_MARKETPLACE
            </Link>
          </div>

          {/* Devnet notice */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#666666]">
            <span className="h-2 w-2 rounded-full bg-[#ffcc00] animate-pulse" />
            <span>
              NETWORK: <span className="text-[#ffcc00]">DEVNET</span> —{" "}
              <a
                href="https://faucet.solana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00d4ff] hover:text-[#00ff41] underline"
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
        className="relative z-10 mt-12 border border-[#00ff41]/25 bg-[#111111]"
      >
        <div className="border-b border-[#00ff41]/25 bg-[#1a1a1a] px-4 py-1.5 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 bg-[#ff3333]" />
            <div className="h-2 w-2 bg-[#ffcc00]" />
            <div className="h-2 w-2 bg-[#00ff41]" />
          </div>
          <span className="text-[#00ff41] text-xs font-mono uppercase tracking-wider">
            PROTOCOL_STATUS
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#00ff41]/25">
          {[
            {
              value: stats?.activeServices ?? "—",
              label: "SERVICES",
              color: "text-[#00ff41]",
            },
            {
              value: stats?.totalTasks ?? "—",
              label: "TASKS",
              color: "text-[#00d4ff]",
            },
            {
              value: stats?.escrowLockedSol ?? "—",
              label: "SOL_LOCKED",
              color: "text-[#ff0080]",
            },
          ].map((stat) => (
            <div key={stat.label} className="px-8 py-4 text-center font-mono">
              <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
              <div className="mt-1 text-xs text-[#666666] uppercase tracking-wider">
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
        className="mt-8 font-mono text-xs text-[#666666]"
      >
        <span className="text-[#00ff41]">root@agentpay</span>
        <span>:</span>
        <span className="text-[#00d4ff]">~</span>
        <span>$ ready_for_autonomous_commerce</span>
        <span className="animate-pulse text-[#00ff41]">█</span>
      </motion.div>
    </section>
  );
}
