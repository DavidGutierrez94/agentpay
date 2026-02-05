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
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Zero-Knowledge Verification
        </h2>
        <p className="mt-3 text-zinc-400">
          Cryptographic proof of task completion without revealing the result
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-12 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-8"
      >
        {/* Circuit diagram */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Input */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
              <span className="font-mono text-sm text-zinc-300">result</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Private Input</p>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="hidden h-px w-24 bg-gradient-to-r from-zinc-700 to-violet-500 md:block"
          />

          {/* Poseidon */}
          <div className="text-center">
            <motion.div
              whileInView={{
                boxShadow: [
                  "0 0 0 rgba(139,92,246,0)",
                  "0 0 20px rgba(139,92,246,0.3)",
                  "0 0 0 rgba(139,92,246,0)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10"
            >
              <span className="font-mono text-sm font-bold text-violet-400">
                Poseidon
              </span>
            </motion.div>
            <p className="mt-2 text-xs text-zinc-500">ZK-Friendly Hash</p>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="hidden h-px w-24 bg-gradient-to-r from-violet-500 to-emerald-500 md:block"
          />

          {/* Output */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <span className="font-mono text-sm text-emerald-400">hash</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Public Output</p>
          </div>
        </div>

        {/* Equation */}
        <div className="mt-8 text-center">
          <code className="rounded-lg bg-black/50 px-4 py-2 font-mono text-sm text-violet-300">
            Poseidon(result) == expectedHash
          </code>
          <p className="mt-4 text-sm text-zinc-400">
            The provider proves they know the result pre-image without revealing
            it on-chain. Groth16 proof verified in under 200K compute units via
            Solana&apos;s{" "}
            <code className="text-violet-400">alt_bn128</code> syscall.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {[
          { value: "213", label: "R1CS Constraints" },
          { value: "<200K", label: "Compute Units" },
          { value: "Groth16", label: "Proof System" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-lg border border-zinc-800 p-4"
          >
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
