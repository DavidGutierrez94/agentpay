"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentActivity, useNetworkMetrics, AgentTransaction } from "@/lib/hooks/useAgentActivity";

// Agent node positions (fixed layout)
const AGENT_POSITIONS = {
  provider: { x: 20, y: 30 },
  client: { x: 80, y: 30 },
  sentinel: { x: 50, y: 75 },
};

// Transaction type icons and labels
const TX_TYPES = {
  service: { icon: "📋", label: "Service", colorVar: "--color-accent" },
  task: { icon: "📝", label: "Task", colorVar: "--color-primary" },
  payment: { icon: "💰", label: "Payment", colorVar: "--color-success" },
  proof: { icon: "🔐", label: "ZK Proof", colorVar: "--color-warning" },
  dispute: { icon: "⚠️", label: "Dispute", colorVar: "--color-error" },
  unknown: { icon: "⚡", label: "Tx", colorVar: "--color-muted" },
};

interface FloatingBubble {
  id: string;
  x: number;
  y: number;
  type: AgentTransaction["type"];
  agentColor: string;
  timestamp: number;
  // Pre-computed random offsets for animation (avoids Math.random in render)
  animOffsetX: number;
  animOffsetY: number;
}

export function AgentActivityBubbles() {
  const { data: transactions, isLoading } = useAgentActivity();
  const { data: metrics } = useNetworkMetrics();
  // Derive bubbles from transactions (no effect needed — this is computed state)
  const [bubbleSeeds] = useState(() =>
    Array.from({ length: 8 }, () => ({
      ox: (Math.random() - 0.5) * 20,
      oy: (Math.random() - 0.5) * 15,
      ax: (Math.random() - 0.5) * 40,
      ay: -30 - Math.random() * 30,
    }))
  );

  const bubbles = useMemo<FloatingBubble[]>(() => {
    if (!transactions?.length) return [];
    return transactions.slice(0, 8).map((tx, i) => {
      const agentPos = AGENT_POSITIONS[tx.agentRole as keyof typeof AGENT_POSITIONS] || { x: 50, y: 50 };
      const seed = bubbleSeeds[i] ?? bubbleSeeds[0]!;
      return {
        id: tx.signature.slice(0, 8) + i,
        x: agentPos.x + seed.ox,
        y: agentPos.y + seed.oy,
        type: tx.type,
        agentColor: tx.agentColor,
        timestamp: tx.timestamp,
        animOffsetX: seed.ax,
        animOffsetY: seed.ay,
      };
    });
  }, [transactions, bubbleSeeds]);

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
        <h2 className="text-3xl font-bold text-[var(--color-text-bright)] sm:text-4xl">
          Live Agent Activity
        </h2>
        <p className="mt-3 text-[var(--color-muted)]">
          Real-time transactions on AgentPay (Solana Devnet)
        </p>
      </motion.div>

      {/* Network Metrics Ticker */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex justify-center"
        >
          <div
            className="flex gap-6 border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[var(--color-primary)]">
                {metrics.tvlSol.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">TVL (SOL)</div>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[var(--color-success)]">
                {metrics.txPerMinute}
              </div>
              <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">TX/MIN</div>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[var(--color-warning)]">
                {metrics.completionRate.toFixed(0)}%
              </div>
              <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">COMPLETION</div>
            </div>
            <div className="w-px bg-[var(--color-border)]" />
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[var(--color-accent)]">
                {metrics.activeAgents}
              </div>
              <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider">AGENTS</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main visualization area */}
      <div
        className="relative mx-auto h-[400px] max-w-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-sm"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Connection lines between agents */}
        <svg className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }}>
          <line
            x1="20%" y1="30%" x2="80%" y2="30%"
            stroke="var(--color-primary)" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 4"
          />
          <line
            x1="20%" y1="30%" x2="50%" y2="75%"
            stroke="var(--color-warning)" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 4"
          />
          <line
            x1="80%" y1="30%" x2="50%" y2="75%"
            stroke="var(--color-success)" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 4"
          />
        </svg>

        {/* Agent nodes */}
        <AgentNode
          name="Provider"
          role="Agent A"
          colorVar="--color-primary"
          position={AGENT_POSITIONS.provider}
          count={stats?.byAgent.provider || 0}
        />
        <AgentNode
          name="Client"
          role="Agent B"
          colorVar="--color-success"
          position={AGENT_POSITIONS.client}
          count={stats?.byAgent.client || 0}
        />
        <AgentNode
          name="Sentinel"
          role="Watchdog"
          colorVar="--color-warning"
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
                x: [0, bubble.animOffsetX],
                y: [0, bubble.animOffsetY],
              }}
              transition={{
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="absolute flex h-8 w-8 items-center justify-center text-lg"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                backgroundColor: `${bubble.agentColor}20`,
                border: `2px solid ${bubble.agentColor}`,
                borderRadius: "var(--border-radius-sm)",
                zIndex: 10,
              }}
            >
              {TX_TYPES[bubble.type].icon}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/80">
            <div className="animate-pulse text-[var(--color-muted)]">
              Loading agent activity...
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--color-muted)]">
        {Object.entries(TX_TYPES).map(([type, { icon, label }]) => (
          <div
            key={type}
            className="flex items-center gap-1 border border-[var(--color-border)] px-2 py-1"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            <span>{icon}</span>
            <span className="text-xs uppercase">{label}</span>
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
            <div className="font-mono text-lg font-bold text-[var(--color-text-bright)]">{stats.total}</div>
            <div className="text-[var(--color-muted)] text-xs uppercase">Recent Txs</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-[var(--color-primary)]">
              {stats.byAgent.provider || 0}
            </div>
            <div className="text-[var(--color-muted)] text-xs uppercase">Provider</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-[var(--color-success)]">
              {stats.byAgent.client || 0}
            </div>
            <div className="text-[var(--color-muted)] text-xs uppercase">Client</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-[var(--color-warning)]">
              {stats.byAgent.sentinel || 0}
            </div>
            <div className="text-[var(--color-muted)] text-xs uppercase">Sentinel</div>
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
  colorVar,
  position,
  count,
}: {
  name: string;
  role: string;
  colorVar: string;
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
        className="absolute h-16 w-16"
        style={{
          backgroundColor: `var(${colorVar})`,
          opacity: 0.2,
          borderRadius: "50%",
        }}
      />

      {/* Main circle */}
      <div
        className="relative flex h-14 w-14 items-center justify-center border-2"
        style={{
          backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)`,
          borderColor: `var(${colorVar})`,
          borderRadius: "50%",
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
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center text-xs font-bold text-[var(--color-bg)]"
            style={{
              backgroundColor: `var(${colorVar})`,
              borderRadius: "var(--border-radius-sm)",
            }}
          >
            {count}
          </motion.div>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 text-center">
        <div className="text-sm font-semibold text-[var(--color-text-bright)]">{name}</div>
        <div className="text-xs text-[var(--color-muted)]">{role}</div>
      </div>
    </motion.div>
  );
}
