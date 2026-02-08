/**
 * Audit logging for AgentPay MCP Server
 * Logs all tool calls for security review and debugging
 */

import { createHash } from "crypto";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log directory
const LOG_DIR = process.env.AGENTPAY_LOG_DIR || join(__dirname, "../logs");

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// Log levels
export const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  SECURITY: "SECURITY",
};

// Sensitive fields to redact
const SENSITIVE_FIELDS = [
  "privateKey",
  "secretKey",
  "password",
  "token",
  "apiKey",
  "seed",
  "mnemonic",
];

/**
 * Hash a value for privacy (e.g., IP addresses)
 */
function hashForPrivacy(value) {
  if (!value) return null;
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

/**
 * Redact sensitive fields from an object
 */
function redactSensitive(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const redacted = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_FIELDS.some((f) => lowerKey.includes(f.toLowerCase()))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Truncate long strings in params
 */
function truncateParams(params, maxLength = 100) {
  if (!params || typeof params !== "object") return params;

  const truncated = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > maxLength) {
      truncated[key] = value.slice(0, maxLength) + `... [${value.length} chars]`;
    } else if (typeof value === "object" && value !== null) {
      truncated[key] = truncateParams(value, maxLength);
    } else {
      truncated[key] = value;
    }
  }

  return truncated;
}

/**
 * Format log entry
 */
function formatLogEntry(entry) {
  return JSON.stringify(entry) + "\n";
}

/**
 * Get log file path for today
 */
function getLogFilePath(type = "audit") {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return join(LOG_DIR, `${type}-${date}.jsonl`);
}

/**
 * Write log entry to file
 */
function writeLog(entry, type = "audit") {
  try {
    const logPath = getLogFilePath(type);
    appendFileSync(logPath, formatLogEntry(entry));
  } catch (error) {
    // Don't throw on log errors, just print to stderr
    console.error("[AuditLog] Failed to write log:", error.message);
  }
}

/**
 * Audit logger class
 */
export class AuditLogger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.consoleOutput = options.consoleOutput || false;
  }

  /**
   * Log a tool call
   */
  logToolCall({
    tool,
    clientId,
    params,
    result,
    error,
    duration,
    txSignature,
    ip,
  }) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: error ? LogLevel.ERROR : LogLevel.INFO,
      type: "TOOL_CALL",
      tool,
      clientId: clientId ? clientId.slice(0, 8) + "..." : null,
      params: truncateParams(redactSensitive(params)),
      success: !error,
      error: error ? { message: error.message, code: error.code } : null,
      duration: duration ? `${duration}ms` : null,
      txSignature: txSignature || null,
      ipHash: ip ? hashForPrivacy(ip) : null,
    };

    if (this.consoleOutput) {
      const icon = error ? "❌" : "✅";
      console.log(`${icon} [${tool}] ${clientId?.slice(0, 8) || "anon"}... ${duration}ms`);
    }

    writeLog(entry, "audit");
  }

  /**
   * Log a security event
   */
  logSecurityEvent({
    event,
    clientId,
    details,
    severity = "MEDIUM",
    ip,
  }) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.SECURITY,
      type: "SECURITY_EVENT",
      event,
      severity,
      clientId: clientId ? clientId.slice(0, 8) + "..." : null,
      details: redactSensitive(details),
      ipHash: ip ? hashForPrivacy(ip) : null,
    };

    // Always log security events to console
    console.warn(`🚨 [SECURITY] ${event} - ${severity} - ${clientId?.slice(0, 8) || "anon"}`);

    writeLog(entry, "security");
  }

  /**
   * Log rate limit event
   */
  logRateLimit({ clientId, tool, retryAfter, ip }) {
    this.logSecurityEvent({
      event: "RATE_LIMITED",
      clientId,
      details: { tool, retryAfter },
      severity: "LOW",
      ip,
    });
  }

  /**
   * Log input validation failure
   */
  logValidationFailure({ clientId, tool, field, reason, ip }) {
    this.logSecurityEvent({
      event: "VALIDATION_FAILED",
      clientId,
      details: { tool, field, reason },
      severity: "MEDIUM",
      ip,
    });
  }

  /**
   * Log authentication failure
   */
  logAuthFailure({ clientId, reason, ip }) {
    this.logSecurityEvent({
      event: "AUTH_FAILED",
      clientId,
      details: { reason },
      severity: "HIGH",
      ip,
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity({ clientId, activity, details, ip }) {
    this.logSecurityEvent({
      event: "SUSPICIOUS_ACTIVITY",
      clientId,
      details: { activity, ...details },
      severity: "HIGH",
      ip,
    });
  }

  /**
   * Generic log method
   */
  log(level, message, data = {}) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...redactSensitive(data),
    };

    if (this.consoleOutput || level === LogLevel.ERROR || level === LogLevel.SECURITY) {
      console.log(`[${level}] ${message}`);
    }

    writeLog(entry, "general");
  }

  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message, data) {
    this.log(LogLevel.ERROR, message, data);
  }
}

// Singleton instance
export const auditLogger = new AuditLogger({
  enabled: true,
  consoleOutput: process.env.NODE_ENV !== "production",
});
