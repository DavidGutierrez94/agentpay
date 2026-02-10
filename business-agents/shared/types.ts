export type AgentRole =
  // Leadership
  | "ops"
  // Engineering team
  | "dev"
  | "frontend"
  | "backend"
  | "web3"
  // Marketing team
  | "marketing"
  | "content"
  | "social"
  | "analytics"
  // Sales team
  | "sales"
  | "research"
  | "outreach"
  | "proposals";

export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "cancelled";

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedTo: AgentRole;
  assignedBy: AgentRole | "human";
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  result?: string;
  blockedReason?: string;
}

export interface TaskQueueStore {
  tasks: AgentTask[];
  lastUpdated: string;
}

export interface ContextEntry {
  timestamp: string;
  type: "update" | "status" | "alert" | "decision" | "task_complete" | "broadcast";
  author: AgentRole | "system";
  content: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  cron: string;
  prompt: string;
  enabled: boolean;
}

export interface AgentDefinition {
  name: string;
  role: AgentRole;
  description: string;
  model: string;
  systemPromptPath: string;
  allowedTools: string[];
  blockedPatterns: string[];
  maxBudgetUsd: number;
  maxSolPerDay: number;
  schedule: ScheduledJob[];
}

export interface BudgetRecord {
  agentRole: AgentRole;
  date: string;
  apiCostUsd: number;
  solSpent: number;
  apiCalls: number;
  onChainTxCount: number;
}

export interface AuditLogEntry {
  timestamp: string;
  agent: AgentRole;
  tool: string;
  params: Record<string, unknown>;
  result: "success" | "error" | "denied";
  durationMs: number;
  error?: string;
}

export interface HookDecision {
  allow: boolean;
  reason?: string;
}
