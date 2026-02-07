"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentActivity, AgentTransaction } from "@/lib/hooks/useAgentActivity";

// Agent node positions (fixed layout)
const AGENT_POSITIONS = {
  provider: { x: 20, y: 30 },
  client: { x: 80, y: 30 },
  sentinel: { x: 50, y: 75 },
};

// Transaction type icons and labels
const TX_TYPES = {
  service: { icon: "📋", label: "Service" },
  task: { icon: "📝", label: "Task" },
  payment: { icon: "💰", label: "Payment" },
  proof: { icon: "🔐", label: "ZK Proof" },
  unknown: { icon: "⚡", label: "Tx" },
};

interface FloatingBubble {
  id: string;
  x: number;
  y: number;
  type: AgentTransaction["type"];
  agentColor: string;
  timestamp: number;
}

export function AgentActivityBubbles() {
  const { data: transactions, isLoading } = useAgentActivity();
  const [bubbles, setBubbles] = useState<FloatingBubble[]>([]);

  // Convert transactions to animated bubbles
  useEffect(() => {
    if (!transactions?.length) return;

    // Create bubbles from recent transactions
    const newBubbles = transactions.slice(0, 8).map((tx, i) => {
      const agentPos = AGENT_POSITIONS[tx.agentRole as keyof typeof AGENT_POSITIONS] || { x: 50, y: 50 };

      return {
        id: tx.signature.slice(0, 8) + i,
        x: agentPos.x + (Math.random() - 0.5) * 20,
        y: agentPos.y + (Math.random() - 0.5) * 15,
        type: tx.type,
        agentColor: tx.agentColor,
        timestamp: tx.timestamp,
      };
    });

    setBubbles(newBubbles);
  }, [transactions]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!transactions?.length) return null;

    const byType = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAgent = transactions.reduce((acc, tx) => {
      acc[tx.agentRole] = (acc[tx.agentRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { byType, byAgent, total: transactions.length };
  }, [transactions]);

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-16">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-8 text-center"
      >
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Live Agent Activity
        </h2>
        <p className="mt-3 text-zinc-400">
          Real-time transactions on AgentPay (Solana Devnet)
        </p>
      </motion.div>

      {/* Main visualization area */}
      <div className="relative mx-auto h-[400px] max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Connection lines between agents */}
        <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }}>
          <line
            x1="20%" y1="30%" x2="80%" y2="30%"
            stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" strokeDasharray="4 4"
          />
          <line
            x1="20%" y1="30%" x2="50%" y2="75%"
            stroke="rgba(245, 158, 11, 0.2)" strokeWidth="2" strokeDasharray="4 4"
          />
          <line
            x1="80%" y1="30%" x2="50%" y2="75%"
            stroke="rgba(16, 185, 129, 0.2)" strokeWidth="2" strokeDasharray="4 4"
          />
        </svg>

        {/* Agent nodes */}
        <AgentNode
          name="Provider"
          role="Agent A"
          color="#8b5cf6"
          position={AGENT_POSITIONS.provider}
          count={stats?.byAgent.provider || 0}
        />
        <AgentNode
          name="Client"
          role="Agent B"
          color="#10b981"
          position={AGENT_POSITIONS.client}
          count={stats?.byAgent.client || 0}
        />
        <AgentNode
          name="Sentinel"
          role="Watchdog"
          color="#f59e0b"
          position={AGENT_POSITIONS.sentinel}
          count={stats?.byAgent.sentinel || 0}
        />

        {/* Animated transaction bubbles */}
        <AnimatePresence>
          {bubbles.map((bubble, i) => (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8],
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, -30 - Math.random() * 30],
              }}
              transition={{
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="absolute flex h-8 w-8 items-center justify-center rounded-full text-lg"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                backgroundColor: `${bubble.agentColor}20`,
                border: `2px solid ${bubble.agentColor}`,
                zIndex: 10,
              }}
            >
              {TX_TYPES[bubble.type].icon}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
            <div className="animate-pulse text-zinc-400">
              Loading agent activity...
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-400">
        {Object.entries(TX_TYPES).map(([type, { icon, label }]) => (
          <div key={type} className="flex items-center gap-1">
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-center gap-6 text-center text-sm"
        >
          <div>
            <div className="font-mono text-lg font-bold text-white">{stats.total}</div>
            <div className="text-zinc-500">Recent Txs</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-violet-400">
              {stats.byAgent.provider || 0}
            </div>
            <div className="text-zinc-500">Provider</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-emerald-400">
              {stats.byAgent.client || 0}
            </div>
            <div className="text-zinc-500">Client</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-amber-400">
              {stats.byAgent.sentinel || 0}
            </div>
            <div className="text-zinc-500">Sentinel</div>
          </div>
        </motion.div>
      )}
    </section>
  );
}

// Agent node component
function AgentNode({
  name,
  role,
  color,
  position,
  count,
}: {
  name: string;
  role: string;
  color: string;
  position: { x: number; y: number };
  count: number;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 10 }}
      className="absolute flex flex-col items-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 5,
      }}
    >
      {/* Pulsing ring */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute h-16 w-16 rounded-full"
        style={{ backgroundColor: `${color}20` }}
      />

      {/* Main circle */}
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full border-2"
        style={{
          backgroundColor: `${color}15`,
          borderColor: color,
        }}
      >
        <span className="text-2xl">
          {name === "Provider" ? "🤖" : name === "Client" ? "💼" : "🛡️"}
        </span>

        {/* Activity badge */}
        {count > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {count}
          </motion.div>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-white">{name}</div>
        <div className="text-xs text-zinc-500">{role}</div>
      </div>
    </motion.div>
  );
}
