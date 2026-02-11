"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

// ─── 8-BIT PIXEL ART CREATURES ───────────────────────────────────────
// Each creature is a small pixel grid rendered as an SVG.
// They wander left-right across the page as fun easter eggs.

type Pixel = 0 | 1 | 2 | 3; // 0=empty, 1=dark, 2=mid, 3=bright

interface CreatureDefinition {
  name: string;
  grid: Pixel[][];
  palette: Record<number, string>; // uses CSS vars for theme compat
  size: number; // viewBox dimension
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
  pixelSize = 3,
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

// ── Wandering Creature (walks left-right across screen) ──
function WanderCreature({
  creature,
  startX,
  speed,
  delay,
  direction,
}: {
  creature: CreatureDefinition;
  startX: number;
  speed: number;
  delay: number;
  direction: 1 | -1;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!mounted) return null;

  // Calculate pixel travel distance (safe after mount = client only)
  const vw = typeof window !== "undefined" ? window.innerWidth / 100 : 14;
  const travelPx = direction * (60 + Math.random() * 30) * vw;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        bottom: 4,
        left: `${startX}%`,
        zIndex: 2,
        transform: `scaleX(${direction})`,
      }}
      initial={{ opacity: 0, x: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        x: [0, travelPx],
      }}
      transition={{
        duration: speed,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: speed * 0.3,
        ease: "linear",
      }}
    >
      {/* Walking bob */}
      <motion.div
        animate={{ y: [0, -3, 0, -2, 0] }}
        transition={{
          duration: 0.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        <PixelSprite creature={creature} pixelSize={3} />
      </motion.div>
    </motion.div>
  );
}

// ── Main Easter Egg Component ──
// Place this inside a relative-positioned parent section.
// Creatures walk across the bottom of the section.
export function PixelCreatures() {
  const prefersReducedMotion = useReducedMotion();

  const creatures = useMemo(
    () => [
      {
        creature: LOBSTER,
        startX: 2,
        speed: 12,
        delay: 1,
        direction: 1 as const,
      },
      {
        creature: ROBOT,
        startX: 80,
        speed: 14,
        delay: 4,
        direction: -1 as const,
      },
      {
        creature: BUG,
        startX: 30,
        speed: 10,
        delay: 7,
        direction: 1 as const,
      },
      {
        creature: BRAIN,
        startX: 60,
        speed: 16,
        delay: 10,
        direction: -1 as const,
      },
    ],
    [],
  );

  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
      style={{ height: 48, zIndex: 2 }}
    >
      {creatures.map((cfg, i) => (
        <WanderCreature key={`creature-${i}-${cfg.creature.name}`} {...cfg} />
      ))}
    </div>
  );
}

// Konami sequence as module constant
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
// Type the Konami code anywhere to trigger a creature swarm!
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
            setTimeout(() => setShowMessage(false), 4000);
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

  const swarm = Array.from({ length: 12 }, (_, i) => ({
    creature: ALL_CREATURES[i % ALL_CREATURES.length]!,
    startX: Math.random() * 80 + 5,
    y: Math.random() * 70 + 15,
    speed: 6 + Math.random() * 8,
    delay: i * 0.2,
    direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
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
            opacity: [0, 1, 1, 0],
            scale: [0, 2, 2, 0],
            x: [`0%`, `${cfg.direction * 50}vw`],
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
            <PixelSprite creature={cfg.creature} pixelSize={4} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Idle Robot Companion ──
// A small robot in the bottom-right that blinks and shows speech bubbles
export function IdleCompanion() {
  const prefersReducedMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
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
      className="fixed bottom-4 right-4 cursor-pointer"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.8 }}
      whileHover={{ scale: 1.3 }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <PixelSprite creature={ROBOT} pixelSize={3} />
          {isBlinking && (
            <div
              className="absolute bg-[var(--color-surface)]"
              style={{
                top: "6px",
                left: "12px",
                width: "18px",
                height: "3px",
              }}
            />
          )}
        </div>
      </motion.div>
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
      "gm anon",
      "WAGMI",
    ],
    [],
  );

  useEffect(() => {
    const show = () => {
      const msg = messages[Math.floor(Math.random() * messages.length)]!;
      setMessage(msg);
      setTimeout(() => setMessage(null), 3000);
    };

    // Show first message after 4s, then every 8-15s
    const firstTimeout = setTimeout(show, 4000);
    const interval = setInterval(show, 8000 + Math.random() * 7000);

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(interval);
    };
  }, [messages]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.8 }}
          className="absolute -top-10 right-0 whitespace-nowrap border border-[var(--color-primary)] bg-[var(--color-surface)] px-3 py-1 font-mono text-[10px] text-[var(--color-primary)]"
          style={{ borderRadius: "var(--border-radius-sm)" }}
        >
          {message}
          {/* Speech bubble tail */}
          <div className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 border-b border-r border-[var(--color-primary)] bg-[var(--color-surface)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
