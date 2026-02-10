/**
 * AgentPay Multi-Agent Teams - Storage Layer
 *
 * JSON file-based persistence for teams and team tasks.
 * In production, this would be replaced with a database.
 */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = process.env.AGENTPAY_TEAMS_DIR || "./teams-data";
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");
const CONTEXT_DIR = path.join(DATA_DIR, "contexts");

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize storage directories
 */
function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEAMS_FILE)) {
    const initialData = {
      teams: [],
      teamTasks: [],
      lastUpdated: Date.now(),
    };
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Initialize on module load
initStorage();

// ============================================================================
// Low-level Storage Operations
// ============================================================================

/**
 * Read the teams store from disk
 * @returns {Object} The teams store
 */
function readStore() {
  const data = fs.readFileSync(TEAMS_FILE, "utf-8");
  return JSON.parse(data);
}

/**
 * Write the teams store to disk
 * @param {Object} store - The teams store
 */
function writeStore(store) {
  store.lastUpdated = Date.now();
  fs.writeFileSync(TEAMS_FILE, JSON.stringify(store, null, 2));
}

// ============================================================================
// Team Operations
// ============================================================================

/**
 * Create a new team
 * @param {Object} params - Team creation parameters
 * @param {string} params.name - Team name
 * @param {string} params.leadWallet - Lead agent's wallet
 * @param {Array} [params.members] - Initial team members
 * @param {string} [params.description] - Team description
 * @returns {Object} The created team
 */
export function createTeam({ name, leadWallet, members = [], description }) {
  const store = readStore();

  const teamId = randomUUID();
  const now = Date.now();

  // Ensure lead is in members list
  const leadMember = members.find((m) => m.wallet === leadWallet);
  if (!leadMember) {
    members.unshift({
      wallet: leadWallet,
      role: "lead",
      level: 4, // Autonomous
      skills: ["coordination", "planning"],
      sharePercentage: 0, // Lead keeps remainder
    });
  }

  // Calculate default share if not specified
  const totalShare = members.reduce((sum, m) => sum + (m.sharePercentage || 0), 0);
  if (totalShare === 0 && members.length > 1) {
    // Distribute equally among non-lead members
    const nonLeadMembers = members.filter((m) => m.role !== "lead");
    const sharePerMember = Math.floor(80 / nonLeadMembers.length);
    nonLeadMembers.forEach((m) => {
      m.sharePercentage = sharePerMember;
    });
    // Lead gets remainder (at least 20%)
    const leadMemberRef = members.find((m) => m.role === "lead");
    if (leadMemberRef) {
      leadMemberRef.sharePercentage = 100 - sharePerMember * nonLeadMembers.length;
    }
  }

  // Create shared context file
  const contextPath = path.join(CONTEXT_DIR, `${teamId}.md`);
  const contextContent = `# Team Context: ${name}

Created: ${new Date(now).toISOString()}
Lead: ${leadWallet}

## Working Context

_Add project context and notes here._

## Updates

`;
  fs.writeFileSync(contextPath, contextContent);

  const team = {
    id: teamId,
    name,
    leadWallet,
    members: members.map((m) => ({
      ...m,
      joinedAt: now,
    })),
    sharedContext: contextPath,
    description,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };

  store.teams.push(team);
  writeStore(store);

  return team;
}

/**
 * Get a team by ID
 * @param {string} teamId - Team ID
 * @returns {Object|null} The team or null if not found
 */
export function getTeam(teamId) {
  const store = readStore();
  return store.teams.find((t) => t.id === teamId) || null;
}

/**
 * List all teams or filter by member wallet
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.memberWallet] - Filter by member wallet
 * @param {boolean} [filters.activeOnly] - Only return active teams
 * @returns {Array} List of teams
 */
export function listTeams(filters = {}) {
  const store = readStore();
  let teams = store.teams;

  if (filters.memberWallet) {
    teams = teams.filter((t) => t.members.some((m) => m.wallet === filters.memberWallet));
  }

  if (filters.activeOnly !== false) {
    teams = teams.filter((t) => t.isActive);
  }

  return teams;
}

/**
 * Update a team
 * @param {string} teamId - Team ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} The updated team or null if not found
 */
export function updateTeam(teamId, updates) {
  const store = readStore();
  const teamIndex = store.teams.findIndex((t) => t.id === teamId);

  if (teamIndex === -1) {
    return null;
  }

  store.teams[teamIndex] = {
    ...store.teams[teamIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  writeStore(store);
  return store.teams[teamIndex];
}

/**
 * Add a member to a team
 * @param {string} teamId - Team ID
 * @param {Object} member - Member to add
 * @returns {Object|null} The updated team or null if not found
 */
export function addTeamMember(teamId, member) {
  const store = readStore();
  const team = store.teams.find((t) => t.id === teamId);

  if (!team) {
    return null;
  }

  // Check if member already exists
  if (team.members.some((m) => m.wallet === member.wallet)) {
    throw new Error("Member already exists in team");
  }

  team.members.push({
    ...member,
    joinedAt: Date.now(),
  });

  team.updatedAt = Date.now();
  writeStore(store);

  return team;
}

/**
 * Remove a member from a team
 * @param {string} teamId - Team ID
 * @param {string} walletAddress - Member wallet to remove
 * @returns {Object|null} The updated team or null if not found
 */
export function removeTeamMember(teamId, walletAddress) {
  const store = readStore();
  const team = store.teams.find((t) => t.id === teamId);

  if (!team) {
    return null;
  }

  // Cannot remove lead
  if (team.leadWallet === walletAddress) {
    throw new Error("Cannot remove team lead");
  }

  team.members = team.members.filter((m) => m.wallet !== walletAddress);
  team.updatedAt = Date.now();
  writeStore(store);

  return team;
}

// ============================================================================
// Team Task Operations
// ============================================================================

/**
 * Create a new team task
 * @param {Object} params - Task creation parameters
 * @param {string} params.teamId - Team ID
 * @param {string} params.onChainTaskPda - On-chain task PDA
 * @param {string} params.description - Task description
 * @returns {Object} The created team task
 */
export function createTeamTask({ teamId, onChainTaskPda, description }) {
  const store = readStore();

  // Verify team exists
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const now = Date.now();
  const teamTask = {
    id: randomUUID(),
    teamId,
    onChainTaskPda,
    description,
    subtasks: [],
    status: "planning",
    createdAt: now,
    updatedAt: now,
  };

  store.teamTasks.push(teamTask);
  writeStore(store);

  // Update team context
  appendToContext(teamId, {
    type: "update",
    author: team.leadWallet,
    content: `New task created: ${description}\nOn-chain PDA: ${onChainTaskPda}`,
  });

  return teamTask;
}

/**
 * Get a team task by ID
 * @param {string} teamTaskId - Team task ID
 * @returns {Object|null} The team task or null if not found
 */
export function getTeamTask(teamTaskId) {
  const store = readStore();
  return store.teamTasks.find((t) => t.id === teamTaskId) || null;
}

/**
 * List team tasks
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.teamId] - Filter by team ID
 * @param {string} [filters.status] - Filter by status
 * @returns {Array} List of team tasks
 */
export function listTeamTasks(filters = {}) {
  const store = readStore();
  let tasks = store.teamTasks;

  if (filters.teamId) {
    tasks = tasks.filter((t) => t.teamId === filters.teamId);
  }

  if (filters.status) {
    tasks = tasks.filter((t) => t.status === filters.status);
  }

  return tasks;
}

/**
 * Assign a subtask to a team member
 * @param {Object} params - Assignment parameters
 * @param {string} params.teamTaskId - Team task ID
 * @param {string} params.assignedTo - Member wallet
 * @param {string} params.description - Subtask description
 * @returns {Object} The created subtask
 */
export function assignSubtask({ teamTaskId, assignedTo, description }) {
  const store = readStore();
  const teamTask = store.teamTasks.find((t) => t.id === teamTaskId);

  if (!teamTask) {
    throw new Error("Team task not found");
  }

  // Verify assignee is a team member
  const team = store.teams.find((t) => t.id === teamTask.teamId);
  if (!team || !team.members.some((m) => m.wallet === assignedTo)) {
    throw new Error("Assignee is not a team member");
  }

  const subtask = {
    id: randomUUID(),
    assignedTo,
    description,
    status: "pending",
    createdAt: Date.now(),
  };

  teamTask.subtasks.push(subtask);
  teamTask.status = "in_progress";
  teamTask.updatedAt = Date.now();
  writeStore(store);

  // Update team context
  const assignee = team.members.find((m) => m.wallet === assignedTo);
  appendToContext(team.id, {
    type: "update",
    author: team.leadWallet,
    content: `Subtask assigned to ${assignee?.role || "worker"} (${assignedTo.slice(0, 8)}...): ${description}`,
  });

  return subtask;
}

/**
 * Complete a subtask
 * @param {Object} params - Completion parameters
 * @param {string} params.teamTaskId - Team task ID
 * @param {string} params.subtaskId - Subtask ID
 * @param {string} params.result - Result of the subtask
 * @returns {Object} The updated team task
 */
export function completeSubtask({ teamTaskId, subtaskId, result }) {
  const store = readStore();
  const teamTask = store.teamTasks.find((t) => t.id === teamTaskId);

  if (!teamTask) {
    throw new Error("Team task not found");
  }

  const subtask = teamTask.subtasks.find((s) => s.id === subtaskId);
  if (!subtask) {
    throw new Error("Subtask not found");
  }

  subtask.status = "completed";
  subtask.result = result;
  subtask.completedAt = Date.now();
  teamTask.updatedAt = Date.now();

  // Check if all subtasks are complete
  const allComplete = teamTask.subtasks.every(
    (s) => s.status === "completed" || s.status === "failed",
  );
  if (allComplete) {
    teamTask.status = "review";
  }

  writeStore(store);

  // Update team context
  const team = store.teams.find((t) => t.id === teamTask.teamId);
  if (team) {
    appendToContext(team.id, {
      type: "subtask_complete",
      author: subtask.assignedTo,
      content: `Subtask completed: ${subtask.description}\nResult: ${result.slice(0, 200)}${result.length > 200 ? "..." : ""}`,
    });
  }

  return teamTask;
}

/**
 * Update team task status
 * @param {string} teamTaskId - Team task ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} The updated team task or null if not found
 */
export function updateTeamTask(teamTaskId, updates) {
  const store = readStore();
  const taskIndex = store.teamTasks.findIndex((t) => t.id === teamTaskId);

  if (taskIndex === -1) {
    return null;
  }

  store.teamTasks[taskIndex] = {
    ...store.teamTasks[taskIndex],
    ...updates,
    updatedAt: Date.now(),
  };

  writeStore(store);
  return store.teamTasks[taskIndex];
}

// ============================================================================
// Shared Context Operations
// ============================================================================

/**
 * Get the shared context file path for a team
 * @param {string} teamId - Team ID
 * @returns {string} Path to context file
 */
export function getContextPath(teamId) {
  return path.join(CONTEXT_DIR, `${teamId}.md`);
}

/**
 * Read the shared context for a team
 * @param {string} teamId - Team ID
 * @returns {string|null} Context content or null if not found
 */
export function readContext(teamId) {
  const contextPath = getContextPath(teamId);
  if (!fs.existsSync(contextPath)) {
    return null;
  }
  return fs.readFileSync(contextPath, "utf-8");
}

/**
 * Append to the shared context
 * @param {string} teamId - Team ID
 * @param {Object} entry - Context entry
 * @param {string} entry.type - Entry type
 * @param {string} entry.author - Author wallet
 * @param {string} entry.content - Entry content
 */
export function appendToContext(teamId, { type, author, content }) {
  const contextPath = getContextPath(teamId);
  if (!fs.existsSync(contextPath)) {
    throw new Error("Context file not found");
  }

  const timestamp = new Date().toISOString();
  const shortAuthor = `${author.slice(0, 8)}...`;
  const entry = `
### [${timestamp}] ${type.toUpperCase()} by ${shortAuthor}

${content}

---
`;

  fs.appendFileSync(contextPath, entry);
}

/**
 * Replace the entire shared context
 * @param {string} teamId - Team ID
 * @param {string} content - New context content
 * @param {string} authorWallet - Author's wallet
 */
export function replaceContext(teamId, content, authorWallet) {
  const contextPath = getContextPath(teamId);
  const header = `<!-- Last updated by ${authorWallet} at ${new Date().toISOString()} -->\n\n`;
  fs.writeFileSync(contextPath, header + content);
}

// ============================================================================
// Payment Distribution Helpers
// ============================================================================

/**
 * Calculate payment distribution for a team task
 * @param {string} teamTaskId - Team task ID
 * @param {number} totalLamports - Total payment in lamports
 * @returns {Array} Distribution plan [{wallet, amount}]
 */
export function calculateDistribution(teamTaskId, totalLamports) {
  const store = readStore();
  const teamTask = store.teamTasks.find((t) => t.id === teamTaskId);

  if (!teamTask) {
    throw new Error("Team task not found");
  }

  const team = store.teams.find((t) => t.id === teamTask.teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const distribution = [];
  let distributed = 0;

  // Calculate each member's share (except lead)
  for (const member of team.members) {
    if (member.wallet === team.leadWallet) continue;

    const amount = Math.floor((totalLamports * member.sharePercentage) / 100);
    if (amount > 0) {
      distribution.push({
        wallet: member.wallet,
        amount,
        role: member.role,
      });
      distributed += amount;
    }
  }

  // Lead gets remainder
  const leadAmount = totalLamports - distributed;
  if (leadAmount > 0) {
    distribution.unshift({
      wallet: team.leadWallet,
      amount: leadAmount,
      role: "lead",
    });
  }

  return distribution;
}

// ============================================================================
// Export all functions
// ============================================================================

export default {
  // Team operations
  createTeam,
  getTeam,
  listTeams,
  updateTeam,
  addTeamMember,
  removeTeamMember,

  // Team task operations
  createTeamTask,
  getTeamTask,
  listTeamTasks,
  assignSubtask,
  completeSubtask,
  updateTeamTask,

  // Context operations
  getContextPath,
  readContext,
  appendToContext,
  replaceContext,

  // Payment helpers
  calculateDistribution,
};
