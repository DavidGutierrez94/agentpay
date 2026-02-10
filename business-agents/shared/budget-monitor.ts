import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "./config.js";
import { createAgentLogger } from "./logger.js";
import type { AgentRole, BudgetRecord, HookDecision } from "./types.js";

const BUDGET_FILE = path.join(CONFIG.sharedStateDir, "budgets.json");

interface BudgetStore {
  records: BudgetRecord[];
  lastUpdated: string;
}

function ensureStore(): void {
  const dir = path.dirname(BUDGET_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(BUDGET_FILE)) {
    const initial: BudgetStore = { records: [], lastUpdated: new Date().toISOString() };
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(initial, null, 2));
  }
}

function readStore(): BudgetStore {
  ensureStore();
  return JSON.parse(fs.readFileSync(BUDGET_FILE, "utf-8"));
}

function writeStore(store: BudgetStore): void {
  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(store, null, 2));
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getTodayRecord(agent: AgentRole): BudgetRecord {
  const store = readStore();
  const date = todayKey();
  let record = store.records.find((r) => r.agentRole === agent && r.date === date);
  if (!record) {
    record = {
      agentRole: agent,
      date,
      apiCostUsd: 0,
      solSpent: 0,
      apiCalls: 0,
      onChainTxCount: 0,
    };
    store.records.push(record);
    writeStore(store);
  }
  return record;
}

export interface AgentBudgetLimits {
  maxBudgetUsd: number;
  maxSolPerDay: number;
}

const DEFAULT_LIMITS: Record<AgentRole, AgentBudgetLimits> = {
  // Leadership
  ops: { maxBudgetUsd: CONFIG.defaultMaxBudgetUsd, maxSolPerDay: CONFIG.defaultMaxSolPerDay },
  // Engineering
  dev: { maxBudgetUsd: CONFIG.defaultMaxBudgetUsd, maxSolPerDay: CONFIG.defaultMaxSolPerDay },
  frontend: { maxBudgetUsd: 8, maxSolPerDay: 0.1 },
  backend: { maxBudgetUsd: 8, maxSolPerDay: 0.3 },
  web3: { maxBudgetUsd: CONFIG.defaultMaxBudgetUsd, maxSolPerDay: CONFIG.defaultMaxSolPerDay },
  // Marketing
  marketing: { maxBudgetUsd: 5, maxSolPerDay: 0.1 },
  content: { maxBudgetUsd: 4, maxSolPerDay: 0.05 },
  social: { maxBudgetUsd: 4, maxSolPerDay: 0.05 },
  analytics: { maxBudgetUsd: 3, maxSolPerDay: 0.05 },
  // Sales
  sales: { maxBudgetUsd: 5, maxSolPerDay: 0.2 },
  research: { maxBudgetUsd: 3, maxSolPerDay: 0.05 },
  outreach: { maxBudgetUsd: 4, maxSolPerDay: 0.1 },
  proposals: { maxBudgetUsd: 4, maxSolPerDay: 0.1 },
};

export function checkBudget(agent: AgentRole, limits?: AgentBudgetLimits): HookDecision {
  const record = getTodayRecord(agent);
  const agentLimits = limits || DEFAULT_LIMITS[agent];
  const logger = createAgentLogger(agent);

  if (record.apiCostUsd >= agentLimits.maxBudgetUsd) {
    logger.warn(`Budget exceeded: $${record.apiCostUsd}/$${agentLimits.maxBudgetUsd}`);
    return {
      allow: false,
      reason: `Daily API budget exceeded: $${record.apiCostUsd}/$${agentLimits.maxBudgetUsd}`,
    };
  }

  if (record.solSpent >= agentLimits.maxSolPerDay) {
    logger.warn(`SOL budget exceeded: ${record.solSpent}/${agentLimits.maxSolPerDay} SOL`);
    return {
      allow: false,
      reason: `Daily SOL budget exceeded: ${record.solSpent}/${agentLimits.maxSolPerDay} SOL`,
    };
  }

  return { allow: true };
}

export function recordApiCall(agent: AgentRole, costUsd: number): void {
  const store = readStore();
  const date = todayKey();
  let record = store.records.find((r) => r.agentRole === agent && r.date === date);
  if (!record) {
    record = { agentRole: agent, date, apiCostUsd: 0, solSpent: 0, apiCalls: 0, onChainTxCount: 0 };
    store.records.push(record);
  }
  record.apiCostUsd += costUsd;
  record.apiCalls += 1;
  writeStore(store);
}

export function recordSolSpend(agent: AgentRole, sol: number): void {
  const store = readStore();
  const date = todayKey();
  let record = store.records.find((r) => r.agentRole === agent && r.date === date);
  if (!record) {
    record = { agentRole: agent, date, apiCostUsd: 0, solSpent: 0, apiCalls: 0, onChainTxCount: 0 };
    store.records.push(record);
  }
  record.solSpent += sol;
  record.onChainTxCount += 1;
  writeStore(store);
}

export function getBudgetSummary(agent: AgentRole): BudgetRecord {
  return getTodayRecord(agent);
}

export function getAllBudgetSummaries(): BudgetRecord[] {
  const store = readStore();
  const date = todayKey();
  return store.records.filter((r) => r.date === date);
}

export function pruneOldRecords(keepDays: number = 30): void {
  const store = readStore();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  store.records = store.records.filter((r) => r.date >= cutoffStr);
  writeStore(store);
}
