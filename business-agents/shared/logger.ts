import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "./config.js";
import type { AgentRole, AuditLogEntry } from "./types.js";

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[minLevel];
}

export function log(
  level: LogLevel,
  agent: AgentRole,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: formatTimestamp(),
    level,
    agent,
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);

  // Console output
  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${agent}]`;
  if (level === "error") {
    console.error(`${prefix} ${message}`);
  } else if (level === "warn") {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }

  // File output
  ensureDir(CONFIG.auditLogDir);
  const logFile = path.join(CONFIG.auditLogDir, `${agent}.log`);
  fs.appendFileSync(logFile, `${line}\n`);
}

export function auditLog(entry: AuditLogEntry): void {
  ensureDir(CONFIG.auditLogDir);
  const auditFile = path.join(CONFIG.auditLogDir, "audit.jsonl");
  fs.appendFileSync(auditFile, `${JSON.stringify(entry)}\n`);

  log(
    entry.result === "denied" ? "warn" : "info",
    entry.agent,
    `Tool: ${entry.tool} | Result: ${entry.result} | ${entry.durationMs}ms`,
    { tool: entry.tool, params: entry.params },
  );
}

export function createAgentLogger(agent: AgentRole) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", agent, msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log("info", agent, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", agent, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", agent, msg, meta),
    audit: (entry: Omit<AuditLogEntry, "agent">) => auditLog({ ...entry, agent }),
  };
}
