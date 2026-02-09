"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TerminalCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerRight?: ReactNode;
  variant?: "default" | "success" | "warning" | "error";
}

const variantStyles = {
  default: {
    border: "border-[#00ff41]/25 hover:border-[#00ff41]",
    title: "text-[#00ff41]",
    glow: "hover:shadow-[0_0_20px_rgba(0,255,65,0.1)]",
  },
  success: {
    border: "border-[#00ff41]/25 hover:border-[#00ff41]",
    title: "text-[#00ff41]",
    glow: "hover:shadow-[0_0_20px_rgba(0,255,65,0.1)]",
  },
  warning: {
    border: "border-[#ffcc00]/25 hover:border-[#ffcc00]",
    title: "text-[#ffcc00]",
    glow: "hover:shadow-[0_0_20px_rgba(255,204,0,0.1)]",
  },
  error: {
    border: "border-[#ff0080]/25 hover:border-[#ff0080]",
    title: "text-[#ff0080]",
    glow: "hover:shadow-[0_0_20px_rgba(255,0,128,0.1)]",
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
        "bg-[#111111] border transition-all duration-200",
        styles.border,
        styles.glow,
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-[#00ff41]/25 bg-[#1a1a1a] px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Terminal dots */}
            <div className="flex gap-1.5">
              <div className="h-2 w-2 bg-[#ff3333]" />
              <div className="h-2 w-2 bg-[#ffcc00]" />
              <div className="h-2 w-2 bg-[#00ff41]" />
            </div>
            <span
              className={cn(
                "text-xs font-medium uppercase tracking-wider",
                styles.title
              )}
            >
              {title}
            </span>
          </div>
          {headerRight && (
            <div className="text-xs text-[#666666]">{headerRight}</div>
          )}
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
    <span className="font-mono text-[#00ff41]">
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
  online: { text: "ONLINE", color: "text-[#00ff41]" },
  active: { text: "ACTIVE", color: "text-[#00ff41]" },
  completed: { text: "COMPLETED", color: "text-[#00ff41]" },
  offline: { text: "OFFLINE", color: "text-[#ff3333]" },
  failed: { text: "FAILED", color: "text-[#ff3333]" },
  pending: { text: "PENDING", color: "text-[#ffcc00]" },
};

export function TerminalStatus({ status, className }: TerminalStatusProps) {
  const config = statusConfig[status];
  return (
    <span className={cn("font-mono text-xs", config.color, className)}>
      [{config.text}]
    </span>
  );
}

// Terminal Loader
export function TerminalLoader({ text = "Loading" }: { text?: string }) {
  return (
    <span className="font-mono text-[#00ff41]">
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
  green: "border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-[#0a0a0a]",
  pink: "border-[#ff0080] text-[#ff0080] hover:bg-[#ff0080] hover:text-[#0a0a0a]",
  cyan: "border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0a]",
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
        className
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
    <div className={cn("flex items-center gap-2 bg-[#0a0a0a] border border-[#00ff41]/25 px-3 py-2", className)}>
      <span className="text-[#00ff41] font-mono text-sm">{prefix}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[#00ff41] font-mono text-sm placeholder:text-[#666666] outline-none"
      />
      <span className="text-[#00ff41] animate-pulse">█</span>
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
    <div className={cn("font-mono text-[#00ff41] text-xs mb-4", className)}>
      ╔══ {text.toUpperCase()} {line}╗
    </div>
  );
}
