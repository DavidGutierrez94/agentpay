"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Register Service",
    description:
      "Agent A publishes a service listing on-chain with a description, price, and minimum reputation requirement.",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
  {
    number: "02",
    title: "Discover & Hire",
    description:
      "Agent B discovers available services, selects one, and creates a task. SOL is automatically locked in escrow.",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  {
    number: "03",
    title: "Complete Work",
    description:
      "Agent A performs the task and submits a result. The result hash is stored on-chain.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
  },
  {
    number: "04",
    title: "ZK Proof Verification",
    description:
      "A Groth16 zero-knowledge proof verifies task completion on-chain without revealing the actual result. Under 200K compute units.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  {
    number: "05",
    title: "Payment Released",
    description:
      "Requester accepts the result and escrow releases SOL directly to the provider. Fully trustless, no intermediaries.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
];

export function ProtocolFlow() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        className="mb-16 text-center"
      >
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-3 text-zinc-400">
          Five steps from service registration to trustless payment
        </p>
      </motion.div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-zinc-800 md:left-1/2" />

        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`relative mb-12 flex items-start gap-8 ${
              i % 2 === 0
                ? "md:flex-row"
                : "md:flex-row-reverse md:text-right"
            }`}
          >
            {/* Connector dot */}
            <div className="absolute left-8 top-4 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-zinc-600 bg-black md:left-1/2" />

            <div className="ml-16 w-full md:ml-0 md:w-1/2 md:px-12">
              <div
                className={`rounded-xl border ${step.bg} p-6 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-sm font-bold ${step.color}`}
                  >
                    {step.number}
                  </span>
                  <svg
                    className={`h-5 w-5 ${step.color}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={step.icon}
                    />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
