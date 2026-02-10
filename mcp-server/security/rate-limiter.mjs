/**
 * Rate limiting for AgentPay MCP Server
 * Uses token bucket algorithm per wallet/IP
 */

// Rate limit configurations per tool
const RATE_LIMITS = {
  // High-cost operations (create transactions)
  create_task: { tokens: 10, refillRate: 1, refillInterval: 6000 }, // 10/min
  submit_result: { tokens: 20, refillRate: 2, refillInterval: 6000 }, // 20/min
  submit_result_zk: { tokens: 10, refillRate: 1, refillInterval: 6000 }, // 10/min (expensive)
  accept_result: { tokens: 20, refillRate: 2, refillInterval: 6000 }, // 20/min
  dispute_task: { tokens: 5, refillRate: 1, refillInterval: 12000 }, // 5/min

  // Read operations (cheaper)
  search_services: { tokens: 60, refillRate: 10, refillInterval: 10000 }, // 60/min
  get_service: { tokens: 120, refillRate: 20, refillInterval: 10000 }, // 120/min
  get_task: { tokens: 120, refillRate: 20, refillInterval: 10000 }, // 120/min
  list_my_tasks: { tokens: 30, refillRate: 5, refillInterval: 10000 }, // 30/min
  get_balance: { tokens: 60, refillRate: 10, refillInterval: 10000 }, // 60/min

  // External API calls
  scan_wallet: { tokens: 20, refillRate: 2, refillInterval: 6000 }, // 20/min (external API)

  // Team tools - write operations
  create_team: { tokens: 10, refillRate: 1, refillInterval: 6000 }, // 10/min
  create_team_task: { tokens: 20, refillRate: 2, refillInterval: 6000 }, // 20/min
  assign_subtask: { tokens: 30, refillRate: 3, refillInterval: 6000 }, // 30/min
  complete_subtask: { tokens: 30, refillRate: 3, refillInterval: 6000 }, // 30/min
  submit_team_result: { tokens: 10, refillRate: 1, refillInterval: 6000 }, // 10/min
  distribute_payment: { tokens: 10, refillRate: 1, refillInterval: 6000 }, // 10/min
  update_team_context: { tokens: 30, refillRate: 3, refillInterval: 6000 }, // 30/min

  // Team tools - read operations
  get_team: { tokens: 120, refillRate: 20, refillInterval: 10000 }, // 120/min
  list_teams: { tokens: 60, refillRate: 10, refillInterval: 10000 }, // 60/min
  get_team_task: { tokens: 120, refillRate: 20, refillInterval: 10000 }, // 120/min
  list_team_tasks: { tokens: 60, refillRate: 10, refillInterval: 10000 }, // 60/min
  get_team_context: { tokens: 60, refillRate: 10, refillInterval: 10000 }, // 60/min

  // Default for unknown tools
  default: { tokens: 100, refillRate: 10, refillInterval: 6000 }, // 100/min
};

// Global rate limit across all tools per client
const GLOBAL_LIMIT = { tokens: 300, refillRate: 30, refillInterval: 6000 }; // 300/min

/**
 * Token bucket implementation
 */
class TokenBucket {
  constructor({ tokens, refillRate, refillInterval }) {
    this.maxTokens = tokens;
    this.tokens = tokens;
    this.refillRate = refillRate;
    this.refillInterval = refillInterval;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token
   * @returns {boolean} - true if token consumed, false if rate limited
   */
  tryConsume() {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillCount = Math.floor(elapsed / this.refillInterval) * this.refillRate;

    if (refillCount > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + refillCount);
      this.lastRefill = now;
    }
  }

  /**
   * Get time until next token available (in ms)
   */
  getRetryAfter() {
    if (this.tokens >= 1) return 0;

    const tokensNeeded = 1 - this.tokens;
    const refillsNeeded = Math.ceil(tokensNeeded / this.refillRate);
    return refillsNeeded * this.refillInterval;
  }

  /**
   * Get current state for debugging
   */
  getState() {
    this.refill();
    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
      retryAfter: this.getRetryAfter(),
    };
  }
}

/**
 * Rate limiter error
 */
export class RateLimitError extends Error {
  constructor(message, retryAfter) {
    super(message);
    this.name = "RateLimitError";
    this.code = "RATE_LIMITED";
    this.retryAfter = retryAfter;
  }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  constructor() {
    // Map of clientId -> tool -> TokenBucket
    this.buckets = new Map();
    // Map of clientId -> global TokenBucket
    this.globalBuckets = new Map();

    // Cleanup old buckets periodically
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get or create bucket for a client and tool
   */
  getBucket(clientId, tool) {
    if (!this.buckets.has(clientId)) {
      this.buckets.set(clientId, new Map());
    }

    const clientBuckets = this.buckets.get(clientId);

    if (!clientBuckets.has(tool)) {
      const config = RATE_LIMITS[tool] || RATE_LIMITS.default;
      clientBuckets.set(tool, new TokenBucket(config));
    }

    return clientBuckets.get(tool);
  }

  /**
   * Get or create global bucket for a client
   */
  getGlobalBucket(clientId) {
    if (!this.globalBuckets.has(clientId)) {
      this.globalBuckets.set(clientId, new TokenBucket(GLOBAL_LIMIT));
    }

    return this.globalBuckets.get(clientId);
  }

  /**
   * Check if request is allowed
   * @param {string} clientId - Client identifier (wallet address or IP)
   * @param {string} tool - Tool name being called
   * @throws {RateLimitError} - If rate limited
   */
  checkLimit(clientId, tool) {
    // Check global limit first
    const globalBucket = this.getGlobalBucket(clientId);
    if (!globalBucket.tryConsume()) {
      const retryAfter = globalBucket.getRetryAfter();
      throw new RateLimitError(
        `Global rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)}s`,
        retryAfter,
      );
    }

    // Check tool-specific limit
    const bucket = this.getBucket(clientId, tool);
    if (!bucket.tryConsume()) {
      const retryAfter = bucket.getRetryAfter();
      throw new RateLimitError(
        `Rate limit exceeded for ${tool}. Try again in ${Math.ceil(retryAfter / 1000)}s`,
        retryAfter,
      );
    }
  }

  /**
   * Get rate limit status for a client
   */
  getStatus(clientId, tool) {
    const globalBucket = this.getGlobalBucket(clientId);
    const toolBucket = this.getBucket(clientId, tool);

    return {
      global: globalBucket.getState(),
      tool: toolBucket.getState(),
    };
  }

  /**
   * Clean up old buckets to prevent memory leaks
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [clientId, toolBuckets] of this.buckets) {
      for (const [tool, bucket] of toolBuckets) {
        if (now - bucket.lastRefill > maxAge) {
          toolBuckets.delete(tool);
        }
      }
      if (toolBuckets.size === 0) {
        this.buckets.delete(clientId);
      }
    }

    for (const [clientId, bucket] of this.globalBuckets) {
      if (now - bucket.lastRefill > maxAge) {
        this.globalBuckets.delete(clientId);
      }
    }
  }

  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
