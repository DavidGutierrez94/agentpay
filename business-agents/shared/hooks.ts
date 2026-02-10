import { checkBudget } from "./budget-monitor.js";
import { createAgentLogger } from "./logger.js";
import type { AgentRole, AuditLogEntry, HookDecision } from "./types.js";

// Dangerous bash patterns that should never be executed
const BLOCKED_BASH_PATTERNS = [
  "rm -rf /",
  "rm -rf ~",
  "sudo ",
  "dd if=",
  "mkfs",
  "> /dev/",
  "curl | bash",
  "curl | sh",
  "wget | bash",
  "wget | sh",
  "chmod 777",
  ":(){ :|:& };:", // fork bomb
];

// Patterns that could access other agents' secrets
const KEYPAIR_PATTERNS = [
  /\.json.*keypair/i,
  /id\.json/,
  /solana.*config/i,
  /private.*key/i,
  /secret.*key/i,
];

// File paths agents should never write to
const PROTECTED_PATHS = [".env", "secrets.yaml", "keypair", "/keys/"];

export interface ToolUseInput {
  toolName: string;
  params: Record<string, unknown>;
}

export function validateBashCommand(input: ToolUseInput, agent: AgentRole): HookDecision {
  const command = (input.params.command as string) || "";
  const logger = createAgentLogger(agent);

  // Block dangerous commands
  for (const pattern of BLOCKED_BASH_PATTERNS) {
    if (command.includes(pattern)) {
      logger.warn(`Blocked dangerous bash command: ${pattern}`, { command });
      return { allow: false, reason: `Blocked dangerous pattern: ${pattern}` };
    }
  }

  // Block keypair access by non-ops agents
  if (agent !== "ops") {
    for (const pattern of KEYPAIR_PATTERNS) {
      if (pattern.test(command)) {
        logger.warn(`Blocked keypair access by ${agent}`, { command });
        return { allow: false, reason: "Keypair access restricted to ops agent only" };
      }
    }
  }

  // Marketing and Sales teams should not have bash access
  const noBashAgents: AgentRole[] = [
    "marketing",
    "content",
    "social",
    "analytics",
    "sales",
    "research",
    "outreach",
    "proposals",
  ];
  if (noBashAgents.includes(agent)) {
    logger.warn(`Bash access denied for ${agent} agent`);
    return { allow: false, reason: `${agent} agent does not have bash access` };
  }

  // Block mainnet operations
  if (command.includes("mainnet") && !command.includes("devnet")) {
    logger.warn("Blocked mainnet operation", { command });
    return { allow: false, reason: "Mainnet operations require human approval" };
  }

  // Frontend agent: restrict to npm/npx/next commands (no anchor, cargo, solana)
  if (agent === "frontend") {
    const blockedForFrontend = ["anchor ", "cargo ", "solana ", "solana-keygen"];
    for (const blocked of blockedForFrontend) {
      if (command.includes(blocked)) {
        logger.warn(`Frontend agent blocked from running: ${blocked}`);
        return {
          allow: false,
          reason: `Frontend agent cannot run ${blocked} commands — use web3 agent`,
        };
      }
    }
  }

  // Web3 agent: should not modify frontend app code via bash
  if (agent === "web3") {
    const blockedForWeb3 = ["next ", "npm run dev"];
    for (const blocked of blockedForWeb3) {
      if (command.includes(blocked)) {
        logger.warn(`Web3 agent blocked from running: ${blocked}`);
        return {
          allow: false,
          reason: `Web3 agent cannot run ${blocked} commands — use frontend agent`,
        };
      }
    }
  }

  return { allow: true };
}

export function validateFileWrite(input: ToolUseInput, agent: AgentRole): HookDecision {
  const filePath = (input.params.file_path as string) || (input.params.path as string) || "";
  const logger = createAgentLogger(agent);

  // Check protected paths
  for (const protectedPath of PROTECTED_PATHS) {
    if (filePath.includes(protectedPath)) {
      logger.warn(`Blocked write to protected path: ${filePath}`);
      return { allow: false, reason: `Cannot write to protected path: ${protectedPath}` };
    }
  }

  // Frontend agent: scoped to app/ directory (Next.js UI)
  if (agent === "frontend") {
    const allowed = filePath.includes("/app/") || filePath.includes("/data/contexts/");
    if (!allowed) {
      return {
        allow: false,
        reason: "Frontend agent can only write to the app/ directory (Next.js UI)",
      };
    }
  }

  // Web3 agent: scoped to programs/, circuits/, and tests/
  if (agent === "web3") {
    const allowed =
      filePath.includes("/programs/") ||
      filePath.includes("/circuits/") ||
      filePath.includes("/tests/") ||
      filePath.includes("/migrations/") ||
      filePath.includes("/data/contexts/");
    if (!allowed) {
      return {
        allow: false,
        reason: "Web3 agent can only write to programs/, circuits/, tests/, and migrations/",
      };
    }
  }

  // Backend agent: scoped to mcp-server/, cli/, security/, agents/skills/
  if (agent === "backend") {
    const allowed =
      filePath.includes("/mcp-server/") ||
      filePath.includes("/cli/") ||
      filePath.includes("/security/") ||
      filePath.includes("/agents/skills/") ||
      filePath.includes("/business-agents/shared/") ||
      filePath.includes("/data/contexts/");
    if (!allowed) {
      return {
        allow: false,
        reason: "Backend agent can only write to mcp-server/, cli/, security/, and agents/skills/",
      };
    }
  }

  // Marketing team: scoped to content/marketing dirs
  const marketingTeam: AgentRole[] = ["marketing", "content", "social", "analytics"];
  if (marketingTeam.includes(agent)) {
    const allowed =
      filePath.includes("/content/") ||
      filePath.includes("/marketing/") ||
      filePath.includes("/data/contexts/");
    if (!allowed) {
      return {
        allow: false,
        reason: `${agent} agent can only write to content/ and marketing/ directories`,
      };
    }
  }

  // Sales team: scoped to sales/crm/proposals dirs
  const salesTeam: AgentRole[] = ["sales", "research", "outreach", "proposals"];
  if (salesTeam.includes(agent)) {
    const allowed =
      filePath.includes("/sales/") ||
      filePath.includes("/crm/") ||
      filePath.includes("/proposals/") ||
      filePath.includes("/data/contexts/");
    if (!allowed) {
      return {
        allow: false,
        reason: `${agent} agent can only write to sales/, crm/, and proposals/ directories`,
      };
    }
  }

  return { allow: true };
}

export function validateAgentPayAction(input: ToolUseInput, agent: AgentRole): HookDecision {
  const logger = createAgentLogger(agent);

  // Check budget before any AgentPay action
  const budgetCheck = checkBudget(agent);
  if (!budgetCheck.allow) {
    return budgetCheck;
  }

  // Only ops, dev, and web3 can create tasks (spend SOL)
  const spendingTools = ["create_task", "submit_result", "submit_result_zk"];
  const spendingAllowed: AgentRole[] = ["ops", "dev", "web3", "backend"];
  if (spendingTools.includes(input.toolName) && !spendingAllowed.includes(agent)) {
    logger.warn(`${agent} agent attempted spending action: ${input.toolName}`);
    return { allow: false, reason: `${agent} agent cannot perform spending operations` };
  }

  return { allow: true };
}

export function preToolUseHook(input: ToolUseInput, agent: AgentRole): HookDecision {
  // Budget check for all tools
  const budgetCheck = checkBudget(agent);
  if (!budgetCheck.allow) {
    return budgetCheck;
  }

  // Route to specific validators
  if (input.toolName === "Bash") {
    return validateBashCommand(input, agent);
  }

  if (input.toolName === "Write" || input.toolName === "Edit") {
    return validateFileWrite(input, agent);
  }

  if (input.toolName.startsWith("mcp__agentpay__")) {
    return validateAgentPayAction(input, agent);
  }

  return { allow: true };
}

export function postToolUseHook(
  input: ToolUseInput,
  agent: AgentRole,
  result: "success" | "error",
  durationMs: number,
  error?: string,
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    agent,
    tool: input.toolName,
    params: input.params,
    result,
    durationMs,
    error,
  };
}
