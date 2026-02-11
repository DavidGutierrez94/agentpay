"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

// ─── 8-BIT PIXEL ART CREATURES ───────────────────────────────────────
// Each creature is a small pixel grid rendered as an SVG.
// They wander left-right across the page bottom as fun easter eggs.

type Pixel = 0 | 1 | 2 | 3; // 0=empty, 1=dark, 2=mid, 3=bright

interface CreatureDefinition {
  name: string;
  grid: Pixel[][];
  palette: Record<number, string>; // uses CSS vars for theme compat
  size: number; // viewBox dimension
  walkFrameFlip?: boolean; // alternate horizontal flip for walk
}

// ── Lobster (AI overlord meme) ──
const LOBSTER: CreatureDefinition = {
  name: "lobster",
  size: 16,
  palette: {
    1: "var(--color-secondary)",
    2: "var(--color-secondary)",
    3: "var(--color-warning)",
  },
  grid: [
    // 16x12 lobster with claws
    [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0],
    [0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0],
    [0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 3, 3, 2, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 1, 2, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 1, 2, 2, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  ],
};

// ── Robot Agent ──
const ROBOT: CreatureDefinition = {
  name: "robot",
  size: 14,
  palette: {
    1: "var(--color-primary-dim)",
    2: "var(--color-primary)",
    3: "var(--color-accent)",
  },
  grid: [
    // 14x12 cute robot
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 3, 2, 2, 3, 2, 1, 0, 0, 0],
    [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0],
    [0, 1, 2, 1, 1, 2, 2, 2, 2, 1, 1, 2, 1, 0],
    [0, 0, 1, 0, 1, 2, 2, 2, 2, 1, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0],
  ],
};

// ── Neural Brain ──
const BRAIN: CreatureDefinition = {
  name: "brain",
  size: 14,
  palette: {
    1: "var(--color-secondary)",
    2: "var(--color-accent)",
    3: "var(--color-warning)",
  },
  grid: [
    [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
    [0, 0, 1, 2, 3, 2, 1, 1, 2, 3, 2, 1, 0, 0],
    [0, 1, 2, 2, 2, 1, 2, 2, 1, 2, 2, 2, 1, 0],
    [0, 1, 2, 3, 1, 2, 2, 2, 2, 1, 3, 2, 1, 0],
    [1, 2, 2, 1, 2, 2, 3, 3, 2, 2, 1, 2, 2, 1],
    [1, 2, 1, 2, 2, 3, 2, 2, 3, 2, 2, 1, 2, 1],
    [0, 1, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1, 0],
    [0, 1, 2, 3, 2, 1, 1, 1, 1, 2, 3, 2, 1, 0],
    [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
    [0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  ],
};

// ── Circuit Bug (blockchain bug) ──
const BUG: CreatureDefinition = {
  name: "bug",
  size: 12,
  palette: {
    1: "var(--color-primary-dim)",
    2: "var(--color-primary)",
    3: "var(--color-success)",
  },
  grid: [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0],
    [1, 0, 0, 1, 2, 2, 2, 2, 1, 0, 0, 1],
    [0, 1, 1, 2, 3, 2, 2, 3, 2, 1, 1, 0],
    [0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0],
    [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1],
    [0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0],
    [1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 1, 1],
    [0, 0, 1, 2, 2, 2, 2, 2, 2, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  ],
};

const ALL_CREATURES = [LOBSTER, ROBOT, BRAIN, BUG];

// ── SVG Pixel Renderer ──
function PixelSprite({
  creature,
  pixelSize = 2,
}: {
  creature: CreatureDefinition;
  pixelSize?: number;
}) {
  const height = creature.grid.length;
  const width = creature.grid[0]?.length ?? creature.size;

  return (
    <svg
      width={width * pixelSize}
      height={height * pixelSize}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
    >
      {creature.grid.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={creature.palette[pixel]}
              opacity={pixel === 1 ? 0.6 : pixel === 3 ? 1 : 0.85}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

// ── Wandering Creature (walks left-right) ──
interface WanderCreatureProps {
  creature: CreatureDefinition;
  startX: number; // starting position (%)
  y: number; // vertical position (px from bottom)
  speed: number; // animation duration (seconds)
  delay: number; // initial delay
  direction: 1 | -1; // 1=right, -1=left
}

function WanderCreature({ creature, startX, y, speed, delay, direction }: WanderCreatureProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!mounted) return null;

  // Walk distance
  const endX =
    direction === 1 ? startX + 25 + Math.random() * 15 : startX - 25 - Math.random() * 15;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        bottom: y,
        left: `${startX}%`,
        zIndex: 1,
        transform: `scaleX(${direction})`,
      }}
      initial={{ opacity: 0, x: 0 }}
      animate={{
        opacity: [0, 0.6, 0.6, 0.6, 0],
        x: [`0%`, `${(endX - startX) * direction}vw`],
      }}
      transition={{
        duration: speed,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: speed * 0.5,
        ease: "linear",
      }}
    >
      {/* Subtle bob animation for walking feel */}
      <motion.div
        animate={{ y: [0, -2, 0, -1, 0] }}
        transition={{
          duration: 0.6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        <PixelSprite creature={creature} pixelSize={2} />
      </motion.div>
    </motion.div>
  );
}

// ── Main Easter Egg Component ──
// Place this inside a relative-positioned parent section.
// Creatures will walk across the bottom.
export function PixelCreatures() {
  const prefersReducedMotion = useReducedMotion();

  // Generate stable creature configs on mount
  const creatures = useMemo(() => {
    // Place 3-4 creatures at various positions
    return [
      {
        creature: LOBSTER,
        startX: 5,
        y: 8,
        speed: 18,
        delay: 3,
        direction: 1 as const,
      },
      {
        creature: ROBOT,
        startX: 85,
        y: 12,
        speed: 22,
        delay: 8,
        direction: -1 as const,
      },
      {
        creature: BUG,
        startX: 40,
        y: 6,
        speed: 15,
        delay: 12,
        direction: 1 as const,
      },
      {
        creature: BRAIN,
        startX: 70,
        y: 16,
        speed: 25,
        delay: 20,
        direction: -1 as const,
      },
    ];
  }, []);

  // Respect reduced motion preference
  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {creatures.map((cfg, i) => (
        <WanderCreature key={`creature-${i}-${cfg.creature.name}`} {...cfg} />
      ))}
    </div>
  );
}

// Konami sequence as module constant (no deps needed in hooks)
const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// ── Konami Code Easter Egg ──
// Type the Konami code (up up down down left right left right b a) anywhere
// to trigger a swarm of pixel creatures!
export function KonamiEasterEgg() {
  const [triggered, setTriggered] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleKeyDown = useCallback(
    (() => {
      let position = 0;
      return (e: KeyboardEvent) => {
        if (e.key === KONAMI_SEQUENCE[position]) {
          position++;
          if (position === KONAMI_SEQUENCE.length) {
            setTriggered(true);
            setShowMessage(true);
            position = 0;
            // Hide message after 4s
            setTimeout(() => setShowMessage(false), 4000);
            // Reset after creatures finish
            setTimeout(() => setTriggered(false), 30000);
          }
        } else {
          position = 0;
        }
      };
    })(),
    [],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!triggered || prefersReducedMotion) return null;

  // Swarm of 12 creatures!
  const swarm = Array.from({ length: 12 }, (_, i) => ({
    creature: ALL_CREATURES[i % ALL_CREATURES.length]!,
    startX: Math.random() * 90,
    y: Math.random() * 80 + 10,
    speed: 8 + Math.random() * 12,
    delay: i * 0.3,
    direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
      {/* Konami message */}
      {showMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 border border-[var(--color-primary)] bg-[var(--color-surface)] px-6 py-3 font-mono text-sm text-[var(--color-primary)] shadow-[var(--glow-primary)]"
        >
          <span className="text-[var(--color-warning)]">[KONAMI]</span> Agent swarm activated!{" "}
          {"\u{1F916}\u{1F99E}\u{1F9E0}\u{1FAB2}"}
        </motion.div>
      )}

      {/* Creature swarm */}
      {swarm.map((cfg, i) => (
        <motion.div
          key={`swarm-${i}`}
          className="absolute"
          style={{
            left: `${cfg.startX}%`,
            top: `${cfg.y}%`,
            transform: `scaleX(${cfg.direction})`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1.5, 1.5, 0],
            x: [`0%`, `${cfg.direction * 40}vw`],
          }}
          transition={{
            duration: cfg.speed,
            delay: cfg.delay,
            ease: "linear",
          }}
        >
          <motion.div
            animate={{ y: [0, -4, 0, -2, 0], rotate: [0, 5, 0, -5, 0] }}
            transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY }}
          >
            <PixelSprite creature={cfg.creature} pixelSize={3} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Idle Robot Companion ──
// A small robot that sits in the corner and occasionally blinks/waves
export function IdleCompanion() {
  const prefersReducedMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // Random blink every 3-6 seconds
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    };

    const interval = setInterval(blink, 3000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 pointer-events-none"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.5, y: 0 }}
      transition={{ delay: 5, duration: 1 }}
      whileHover={{ opacity: 1, scale: 1.2 }}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <div className="relative">
          <PixelSprite creature={ROBOT} pixelSize={2} />
          {/* Blink overlay */}
          {isBlinking && (
            <div
              className="absolute bg-[var(--color-primary)]"
              style={{
                top: "4px",
                left: "8px",
                width: "12px",
                height: "2px",
              }}
            />
          )}
        </div>
      </motion.div>
      {/* Speech bubble that appears occasionally */}
      <SpeechBubble />
    </motion.div>
  );
}

// ── Speech Bubble for the companion ──
function SpeechBubble() {
  const [message, setMessage] = useState<string | null>(null);

  const messages = useMemo(
    () => [
      "beep boop",
      "mining SOL...",
      "ZK proof ok",
      "escrow locked",
      "task complete!",
      "01101001",
      "agents online",
      "hash verified",
      "no middlemen",
    ],
    [],
  );

  useEffect(() => {
    const show = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)]!;
      setMessage(msg);
      setTimeout(() => setMessage(null), 2500);
    };

    // Show first message after 10s, then every 15-25s
    const firstTimeout = setTimeout(show, 10000);
    const interval = setInterval(show, 15000 + Math.random() * 10000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [messages]);

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      className="absolute -top-8 -left-4 whitespace-nowrap border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[8px] text-[var(--color-primary)]"
    >
      {message}
    </motion.div>
  );
}
