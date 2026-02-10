import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Model provider type
export type ModelProvider = "openrouter" | "anthropic";

export const CONFIG = {
  // Solana
  programId: process.env.AGENTPAY_PROGRAM_ID || "2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw",
  rpcUrl: process.env.AGENTPAY_RPC || "https://api.devnet.solana.com",
  network: process.env.SOLANA_NETWORK || "devnet",

  // Paths
  projectRoot: path.resolve(__dirname, "../../"),
  businessAgentsRoot: path.resolve(__dirname, "../"),
  sharedStateDir: process.env.SHARED_STATE_DIR || path.resolve(__dirname, "../data"),
  auditLogDir: process.env.AUDIT_LOG_DIR || path.resolve(__dirname, "../data/audit"),
  mcpServerPath: path.resolve(__dirname, "../../mcp-server/index.mjs"),

  // Model Provider Configuration
  modelProvider: (process.env.MODEL_PROVIDER || "openrouter") as ModelProvider,

  // OpenRouter config (primary)
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    siteUrl: "https://agentpay.io",
    siteName: "AgentPay",
  },

  // OpenRouter models (with provider prefix)
  openRouterModels: {
    default: "anthropic/claude-sonnet-4-20250514" as const,
    leader: "anthropic/claude-sonnet-4-20250514" as const,
    fast: "anthropic/claude-3-5-haiku-20241022" as const,
  },

  // Anthropic models (direct)
  anthropicModels: {
    default: "claude-sonnet-4-20250514" as const,
    leader: "claude-sonnet-4-20250514" as const,
    fast: "claude-3-5-haiku-20241022" as const,
  },

  // Dynamic model getters based on provider
  get defaultModel(): string {
    return this.modelProvider === "openrouter"
      ? this.openRouterModels.default
      : this.anthropicModels.default;
  },

  get leaderModel(): string {
    return this.modelProvider === "openrouter"
      ? this.openRouterModels.leader
      : this.anthropicModels.leader;
  },

  get fastModel(): string {
    return this.modelProvider === "openrouter"
      ? this.openRouterModels.fast
      : this.anthropicModels.fast;
  },

  // Budget defaults (per day)
  defaultMaxBudgetUsd: 10,
  defaultMaxSolPerDay: 0.5,

  // Rate limits
  maxApiCallsPerMinute: 20,
  maxOnChainTxPerHour: 30,

  // Agent names
  agents: {
    // Leadership
    ops: "ops-agent",
    // Engineering
    dev: "dev-agent",
    frontend: "frontend-agent",
    backend: "backend-agent",
    web3: "web3-agent",
    // Marketing
    marketing: "marketing-agent",
    content: "content-agent",
    social: "social-agent",
    analytics: "analytics-agent",
    // Sales
    sales: "sales-agent",
    research: "research-agent",
    outreach: "outreach-agent",
    proposals: "proposals-agent",
  } as const,
} as const;

export type AgentName = (typeof CONFIG.agents)[keyof typeof CONFIG.agents];
