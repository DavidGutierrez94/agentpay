"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TerminalCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerRight?: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
}

const variantStyles = {
  default: {
    border: "border-[var(--color-border)] hover:border-[var(--color-border-bright)]",
    title: "text-[var(--color-primary)]",
    glow: "hover:shadow-[var(--card-shadow)]",
  },
  success: {
    border: "border-[var(--color-border)] hover:border-[var(--color-border-bright)]",
    title: "text-[var(--color-primary)]",
    glow: "hover:shadow-[var(--card-shadow)]",
  },
  warning: {
    border: "border-[var(--color-warning)]/25 hover:border-[var(--color-warning)]",
    title: "text-[var(--color-warning)]",
    glow: "hover:shadow-[var(--card-shadow)]",
  },
  error: {
    border: "border-[var(--color-secondary)]/25 hover:border-[var(--color-secondary)]",
    title: "text-[var(--color-secondary)]",
    glow: "hover:shadow-[var(--card-shadow)]",
  },
};

export function TerminalCard({
  children,
  title,
  className,
  headerRight,
  variant = "default",
}: TerminalCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] border transition-all duration-200",
        styles.border,
        styles.glow,
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Terminal dots */}
            <div className="flex gap-1.5">
              <div className="h-2 w-2 bg-[var(--color-error)]" />
              <div className="h-2 w-2 bg-[var(--color-warning)]" />
              <div className="h-2 w-2 bg-[var(--color-primary)]" />
            </div>
            <span className={cn("text-xs font-medium uppercase tracking-wider", styles.title)}>
              {title}
            </span>
          </div>
          {headerRight && <div className="text-xs text-[var(--color-text-dim)]">{headerRight}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ASCII Progress Bar Component
interface TerminalProgressProps {
  value: number; // 0-100
  width?: number; // number of characters
  showPercentage?: boolean;
}

export function TerminalProgress({
  value,
  width = 20,
  showPercentage = true,
}: TerminalProgressProps) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <span className="font-mono text-[var(--color-primary)]">
      [{bar}] {showPercentage && `${Math.round(value)}%`}
    </span>
  );
}

// Terminal Status Badge
interface TerminalStatusProps {
  status: "online" | "offline" | "pending" | "active" | "completed" | "failed";
  className?: string;
}

const statusConfig = {
  online: { text: "ONLINE", color: "text-[var(--color-primary)]" },
  active: { text: "ACTIVE", color: "text-[var(--color-primary)]" },
  completed: { text: "COMPLETED", color: "text-[var(--color-primary)]" },
  offline: { text: "OFFLINE", color: "text-[var(--color-error)]" },
  failed: { text: "FAILED", color: "text-[var(--color-error)]" },
  pending: { text: "PENDING", color: "text-[var(--color-warning)]" },
};

export function TerminalStatus({ status, className }: TerminalStatusProps) {
  const config = statusConfig[status];
  return <span className={cn("font-mono text-xs", config.color, className)}>[{config.text}]</span>;
}

// Terminal Loader
export function TerminalLoader({ text = "Loading" }: { text?: string }) {
  return (
    <span className="font-mono text-[var(--color-primary)]">
      {text}
      <span className="inline-block animate-pulse">...</span>
    </span>
  );
}

// Terminal Button
interface TerminalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "green" | "pink" | "cyan";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

const buttonVariants = {
  green:
    "border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]",
  pink: "border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-bg)]",
  cyan: "border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)]",
};

export function TerminalButton({
  children,
  onClick,
  variant = "green",
  disabled,
  className,
  type = "button",
}: TerminalButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all duration-200",
        buttonVariants[variant],
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

// Terminal Input
interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
}

export function TerminalInput({
  value,
  onChange,
  placeholder,
  className,
  prefix = ">",
}: TerminalInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-2",
        className,
      )}
    >
      <span className="text-[var(--color-primary)] font-mono text-sm">{prefix}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[var(--color-primary)] font-mono text-sm placeholder:text-[var(--color-text-dim)] outline-none"
      />
      <span className="text-[var(--color-primary)] animate-pulse">█</span>
    </div>
  );
}

// ASCII Section Header
interface AsciiHeaderProps {
  text: string;
  className?: string;
}

export function AsciiHeader({ text, className }: AsciiHeaderProps) {
  const line = "═".repeat(Math.max(0, 60 - text.length - 4));
  return (
    <div className={cn("font-mono text-[var(--color-primary)] text-xs mb-4", className)}>
      ╔══ {text.toUpperCase()} {line}╗
    </div>
  );
}
