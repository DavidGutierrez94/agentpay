/**
 * AgentPay Multi-Agent Teams - Type Definitions
 *
 * Based on patterns from:
 * - Kevin Simback's "Managing OpenClaw Agent Teams" (SOUL.md, Agent Levels)
 * - Khaliq Gant's "Agent Relay" (Lead + Workers + Reviewers)
 *
 * Architecture: Lead Agent Settlement Pattern
 * - Off-chain team coordination
 * - On-chain settlement via lead wallet
 * - Post-settlement distribution to team members
 */

// ============================================================================
// Agent Level Framework
// ============================================================================

/**
 * Agent capability levels (from Kevin Simback's framework)
 *
 * L1 Observer: Can perform tasks but cannot take action
 * L2 Advisor: Can perform tasks, recommend actions, execute on approval
 * L3 Operator: Can autonomously execute within guardrails, reports daily
 * L4 Autonomous: Full authority over permissioned domains
 */
export type AgentLevel = 1 | 2 | 3 | 4;

export const AGENT_LEVEL_NAMES: Record<AgentLevel, string> = {
  1: "Observer",
  2: "Advisor",
  3: "Operator",
  4: "Autonomous",
};

// ============================================================================
// Team Member Roles
// ============================================================================

/**
 * Team member roles (inspired by Agent Relay patterns)
 *
 * lead: Coordinates team, breaks down tasks, submits to on-chain
 * backend: Backend development work
 * frontend: Frontend development work
 * researcher: Research and analysis
 * reviewer: Shadow agent that catches lazy work
 * worker: General-purpose worker
 */
export type TeamRole =
  | "lead"
  | "backend"
  | "frontend"
  | "researcher"
  | "reviewer"
  | "worker";

// ============================================================================
// Team Data Model
// ============================================================================

/**
 * Team member definition
 */
export interface TeamMember {
  /** Solana wallet address */
  wallet: string;

  /** Role in the team */
  role: TeamRole;

  /** Agent capability level (1-4) */
  level: AgentLevel;

  /** Skills/capabilities this agent has */
  skills: string[];

  /** Payment share percentage (must sum to 100 across team) */
  sharePercentage: number;

  /** When this member joined the team */
  joinedAt: number;
}

/**
 * Team definition
 *
 * A team is a group of agents that work together on tasks.
 * The lead wallet is used for on-chain settlement.
 */
export interface Team {
  /** Unique team identifier (UUID) */
  id: string;

  /** Human-readable team name */
  name: string;

  /** Lead agent's wallet (used for on-chain settlement) */
  leadWallet: string;

  /** Team members (including lead) */
  members: TeamMember[];

  /** Path to shared context file (CONTEXT.md pattern) */
  sharedContext: string;

  /** Team description/purpose */
  description?: string;

  /** When this team was created */
  createdAt: number;

  /** When this team was last updated */
  updatedAt: number;

  /** Whether the team is active */
  isActive: boolean;
}

// ============================================================================
// Team Task Data Model
// ============================================================================

/**
 * Subtask status
 */
export type SubTaskStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * Subtask definition
 *
 * A subtask is a piece of work assigned to a specific team member.
 */
export interface SubTask {
  /** Unique subtask identifier (UUID) */
  id: string;

  /** Wallet address of assigned team member */
  assignedTo: string;

  /** Description of what needs to be done */
  description: string;

  /** Current status */
  status: SubTaskStatus;

  /** Result when completed */
  result?: string;

  /** When this subtask was created */
  createdAt: number;

  /** When this subtask was completed (if applicable) */
  completedAt?: number;
}

/**
 * Team task status
 */
export type TeamTaskStatus =
  | "planning"      // Lead is breaking down the task
  | "in_progress"   // Workers are executing subtasks
  | "review"        // All subtasks done, lead is aggregating
  | "submitted"     // Result submitted to on-chain task
  | "completed"     // On-chain task accepted, payment distributed
  | "failed";       // Task failed or disputed

/**
 * Team task definition
 *
 * A team task links an on-chain AgentPay task to off-chain team coordination.
 * Team = Project = TaskList (1:1 correspondence per Khaliq Gant)
 */
export interface TeamTask {
  /** Unique team task identifier (UUID) */
  id: string;

  /** Team that owns this task */
  teamId: string;

  /** On-chain AgentPay task PDA */
  onChainTaskPda: string;

  /** Description of the overall task */
  description: string;

  /** Subtasks assigned to team members */
  subtasks: SubTask[];

  /** Current status */
  status: TeamTaskStatus;

  /** Aggregated result (assembled by lead before submission) */
  aggregatedResult?: string;

  /** On-chain transaction signature for submission */
  submitTxSignature?: string;

  /** Payment distribution transaction signatures */
  distributionTxSignatures?: string[];

  /** When this team task was created */
  createdAt: number;

  /** When this team task was last updated */
  updatedAt: number;
}

// ============================================================================
// Shared Context (CONTEXT.md pattern)
// ============================================================================

/**
 * Context entry in shared context file
 */
export interface ContextEntry {
  /** When this entry was added */
  timestamp: number;

  /** Wallet of agent who added this entry */
  author: string;

  /** Type of entry */
  type: "update" | "subtask_complete" | "question" | "decision" | "note";

  /** Content of the entry */
  content: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CreateTeamParams {
  name: string;
  leadWallet: string;
  members?: Omit<TeamMember, "joinedAt">[];
  description?: string;
}

export interface CreateTeamTaskParams {
  teamId: string;
  onChainTaskPda: string;
  description: string;
}

export interface AssignSubtaskParams {
  teamTaskId: string;
  assignedTo: string;
  description: string;
}

export interface CompleteSubtaskParams {
  teamTaskId: string;
  subtaskId: string;
  result: string;
}

export interface SubmitTeamResultParams {
  teamTaskId: string;
  aggregatedResult: string;
}

export interface DistributePaymentParams {
  teamTaskId: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface TeamsStore {
  teams: Team[];
  teamTasks: TeamTask[];
  lastUpdated: number;
}
