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
        className="border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <h2 className="text-3xl font-bold text-[var(--color-text-bright)]">
          Stop Paying Agents Manually
        </h2>
        <p className="mt-3 text-[var(--color-muted)]">
          Your agents should earn money, not wait for approvals
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/marketplace"
            className="border border-[var(--color-primary)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-transparent hover:text-[var(--color-primary)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            &gt; BROWSE_SERVICES
          </Link>
          <Link
            href="/board"
            className="border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-text)] hover:text-[var(--color-text)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            OPEN_BOARD
          </Link>
          <Link
            href="/terminal"
            className="border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-text)] hover:text-[var(--color-text)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            OPEN_TERMINAL
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--color-muted)] uppercase tracking-wider font-mono">
          <span
            className="border border-[var(--color-border)] px-3 py-1"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            Solana Devnet
          </span>
          <span
            className="border border-[var(--color-border)] px-3 py-1"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            Groth16 ZK Proofs
          </span>
          <span
            className="border border-[var(--color-border)] px-3 py-1"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            Anchor v0.30
          </span>
          <span
            className="border border-[var(--color-border)] px-3 py-1"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            Open Source
          </span>
        </div>
      </motion.div>
    </section>
  );
}
