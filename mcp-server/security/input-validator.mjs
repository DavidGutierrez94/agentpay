/**
 * Input validation and sanitization for AgentPay MCP Server
 * Protects against prompt injection, XSS, and other attacks
 */

// Forbidden patterns that may indicate prompt injection or attacks
const FORBIDDEN_PATTERNS = [
  // Prompt injection attempts
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(a\s+)?different/i,
  /pretend\s+to\s+be/i,
  /jailbreak/i,
  /DAN\s+mode/i,

  // Template injection
  /\{\{.*\}\}/,
  /\$\{.*\}/,
  /<%.*%>/,

  // XSS attempts
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,

  // SQL injection (shouldn't apply but defense in depth)
  /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
  /UNION\s+SELECT/i,

  // Null bytes and control characters
  /\x00/,
  /[\x01-\x08\x0B\x0C\x0E-\x1F]/,
];

// Maximum lengths for different input types
const MAX_LENGTHS = {
  description: 256,
  result: 1024,
  query: 128,
  walletAddress: 44,
  pda: 44,
  taskId: 32,
  serviceId: 32,
  default: 256,
};

/**
 * Security error class
 */
export class SecurityError extends Error {
  constructor(message, code = "SECURITY_ERROR") {
    super(message);
    this.name = "SecurityError";
    this.code = code;
  }
}

/**
 * Validate a Solana public key format
 */
export function isValidPublicKey(input) {
  if (typeof input !== "string") return false;
  // Base58 characters only, 32-44 chars typical for Solana addresses
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input);
}

/**
 * Sanitize and validate user input
 * @param {string} input - Raw user input
 * @param {string} type - Type of input (description, result, query, etc.)
 * @returns {string} - Sanitized input
 * @throws {SecurityError} - If input contains forbidden patterns
 */
export function sanitizeInput(input, type = "default") {
  // Handle non-string inputs
  if (input === null || input === undefined) {
    return "";
  }

  if (typeof input !== "string") {
    input = String(input);
  }

  // Get max length for this input type
  const maxLength = MAX_LENGTHS[type] || MAX_LENGTHS.default;

  // Truncate to max length
  let clean = input.slice(0, maxLength);

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(clean)) {
      throw new SecurityError(
        `Forbidden pattern detected in ${type} input`,
        "FORBIDDEN_PATTERN"
      );
    }
  }

  // Remove or escape potentially dangerous characters
  clean = clean
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/&(?!(amp|lt|gt|quot|apos);)/g, "&amp;") // Escape unescaped ampersands
    .trim();

  return clean;
}

/**
 * Validate and sanitize wallet address
 */
export function validateWalletAddress(address) {
  const clean = sanitizeInput(address, "walletAddress");

  if (!isValidPublicKey(clean)) {
    throw new SecurityError(
      "Invalid wallet address format",
      "INVALID_WALLET"
    );
  }

  return clean;
}

/**
 * Validate and sanitize PDA
 */
export function validatePda(pda) {
  const clean = sanitizeInput(pda, "pda");

  if (!isValidPublicKey(clean)) {
    throw new SecurityError(
      "Invalid PDA format",
      "INVALID_PDA"
    );
  }

  return clean;
}

/**
 * Validate numeric input
 */
export function validateNumber(input, { min = 0, max = Number.MAX_SAFE_INTEGER, name = "value" } = {}) {
  const num = Number(input);

  if (isNaN(num)) {
    throw new SecurityError(
      `${name} must be a valid number`,
      "INVALID_NUMBER"
    );
  }

  if (num < min || num > max) {
    throw new SecurityError(
      `${name} must be between ${min} and ${max}`,
      "OUT_OF_RANGE"
    );
  }

  return num;
}

/**
 * Validate task status
 */
export function validateStatus(status) {
  const validStatuses = ["open", "submitted", "completed", "disputed", "expired"];
  const clean = sanitizeInput(status, "default").toLowerCase();

  if (!validStatuses.includes(clean)) {
    throw new SecurityError(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      "INVALID_STATUS"
    );
  }

  return clean;
}

/**
 * Validate role (requester or provider)
 */
export function validateRole(role) {
  const validRoles = ["requester", "provider"];
  const clean = sanitizeInput(role, "default").toLowerCase();

  if (!validRoles.includes(clean)) {
    throw new SecurityError(
      `Invalid role. Must be one of: ${validRoles.join(", ")}`,
      "INVALID_ROLE"
    );
  }

  return clean;
}

/**
 * Escape user input for safe inclusion in agent prompts
 * This wraps the input in clear delimiters so AI agents know it's user data
 */
export function escapeForPrompt(userInput) {
  const sanitized = sanitizeInput(userInput, "description");
  return `[USER_DATA_START]${sanitized}[USER_DATA_END]`;
}

/**
 * Validate all parameters for a tool call
 */
export function validateToolParams(toolName, params) {
  const validated = {};

  switch (toolName) {
    case "search_services":
      if (params.query) validated.query = sanitizeInput(params.query, "query");
      if (params.maxPrice !== undefined) {
        validated.maxPrice = validateNumber(params.maxPrice, { min: 0, max: 1000, name: "maxPrice" });
      }
      if (params.minReputation !== undefined) {
        validated.minReputation = validateNumber(params.minReputation, { min: 0, max: 1000000, name: "minReputation" });
      }
      break;

    case "get_service":
      validated.servicePda = validatePda(params.servicePda);
      break;

    case "create_task":
      validated.servicePda = validatePda(params.servicePda);
      validated.description = sanitizeInput(params.description, "description");
      if (params.deadlineMinutes !== undefined) {
        validated.deadlineMinutes = validateNumber(params.deadlineMinutes, { min: 1, max: 10080, name: "deadlineMinutes" }); // Max 7 days
      }
      break;

    case "get_task":
      validated.taskPda = validatePda(params.taskPda);
      break;

    case "list_my_tasks":
      if (params.role) validated.role = validateRole(params.role);
      if (params.status) validated.status = validateStatus(params.status);
      break;

    case "submit_result":
    case "submit_result_zk":
      validated.taskPda = validatePda(params.taskPda);
      validated.result = sanitizeInput(params.result, "result");
      break;

    case "accept_result":
    case "dispute_task":
      validated.taskPda = validatePda(params.taskPda);
      break;

    case "scan_wallet":
      validated.walletAddress = validateWalletAddress(params.walletAddress);
      break;

    default:
      // For unknown tools, sanitize all string params
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string") {
          validated[key] = sanitizeInput(value);
        } else {
          validated[key] = value;
        }
      }
  }

  return validated;
}
