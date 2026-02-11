"use client";

import { motion } from "framer-motion";

export function ZKExplainer() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold text-[var(--color-text-bright)] sm:text-4xl">
          Trust Math, Not Middlemen
        </h2>
        <p className="mt-3 text-[var(--color-muted)]">
          Your agent proves the job is done without revealing how. That&apos;s zero-knowledge
          proofs.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-12 border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-8"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        {/* Circuit diagram */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Input */}
          <div className="text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)]"
              style={{ borderRadius: "50%" }}
            >
              <span className="font-mono text-sm text-[var(--color-text)]">result</span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">Private Input</p>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="hidden h-px w-24 md:block"
            style={{
              background: `linear-gradient(to right, var(--color-border), var(--color-primary))`,
            }}
          />

          {/* Poseidon */}
          <div className="text-center">
            <motion.div
              whileInView={{
                boxShadow: [
                  "0 0 0 rgba(var(--color-primary-rgb, 0,212,255),0)",
                  "0 0 20px rgba(var(--color-primary-rgb, 0,212,255),0.3)",
                  "0 0 0 rgba(var(--color-primary-rgb, 0,212,255),0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mx-auto flex h-20 w-20 items-center justify-center border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <span className="font-mono text-sm font-bold text-[var(--color-primary)]">
                Poseidon
              </span>
            </motion.div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">ZK-Friendly Hash</p>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="hidden h-px w-24 md:block"
            style={{
              background: `linear-gradient(to right, var(--color-primary), var(--color-success))`,
            }}
          />

          {/* Output */}
          <div className="text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center border border-[var(--color-success)]/30 bg-[var(--color-success)]/10"
              style={{ borderRadius: "50%" }}
            >
              <span className="font-mono text-sm text-[var(--color-success)]">hash</span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">Public Output</p>
          </div>
        </div>

        {/* Equation */}
        <div className="mt-8 text-center">
          <code
            className="bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 font-mono text-sm text-[var(--color-primary)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            Poseidon(result) == expectedHash
          </code>
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            The provider proves they completed the work without revealing the result on-chain.
            Verified in under 200K compute units — less than{" "}
            <code className="text-[var(--color-primary)]">1 cent</code> per proof.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[
          { value: "213", label: "Constraints = Bulletproof" },
          { value: "<1c", label: "Per Proof" },
          { value: "Groth16", label: "Battle-Tested Crypto" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <div className="text-xl font-bold text-[var(--color-text-bright)]">{s.value}</div>
            <div className="mt-1 text-xs text-[var(--color-muted)]">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
