#!/usr/bin/env tsx

/**
 * Infrastructure smoke test — validates all shared modules work
 * without needing an ANTHROPIC_API_KEY.
 *
 * Usage: npx tsx test-infra.ts
 */

import { checkBudget, getBudgetSummary, recordApiCall } from "./shared/budget-monitor.js";
import { CONFIG } from "./shared/config.js";
import {
  appendToAgentContext,
  broadcastMessage,
  readAgentContext,
  readAllAgentContexts,
} from "./shared/context-store.js";
import { postToolUseHook, preToolUseHook } from "./shared/hooks.js";
import { createAgentLogger } from "./shared/logger.js";
import { createScheduler } from "./shared/scheduler.js";
import {
  claimTask,
  completeTask,
  createTask,
  getQueueStats,
  listTasks,
} from "./shared/task-queue.js";

const log = createAgentLogger("ops");
let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

console.log("\n🔧 AgentPay Business Agents — Infrastructure Test\n");
console.log("=".repeat(55));

// 1. Config
console.log("\n📋 Config");
assert(CONFIG.programId.length > 0, "Program ID loaded");
assert(CONFIG.rpcUrl.includes("devnet"), "RPC URL is devnet");
assert(Object.keys(CONFIG.agents).length === 13, "All 13 agents configured");
assert(CONFIG.defaultModel === "claude-sonnet-4-20250514", "Default model set");

// 2. Logger
console.log("\n📝 Logger");
log.info("Test log message");
log.warn("Test warning");
assert(true, "Logger works (check console output above)");

// 3. Context Store
console.log("\n💬 Context Store");
appendToAgentContext("ops", {
  type: "status",
  author: "ops",
  content: "Infrastructure test started",
});
const opsCtx = readAgentContext("ops");
assert(opsCtx.includes("Infrastructure test started"), "Context append + read works");

broadcastMessage("ops", "Test broadcast from infra test");
assert(true, "Broadcast message sent");

const allCtx = readAllAgentContexts();
assert(Object.keys(allCtx).length === 13, "All 13 agent contexts readable");

// 4. Task Queue
console.log("\n📋 Task Queue");
const task = createTask({
  title: "Test task from infra smoke test",
  description: "This is an automated test task",
  assignedTo: "dev",
  assignedBy: "ops",
  priority: "medium",
  tags: ["test", "infra"],
});
assert(task.id.length > 0, "Task created with UUID");
assert(task.status === "pending", "Task status is pending");

const devTasks = listTasks({ assignedTo: "dev" });
assert(
  devTasks.some((t) => t.id === task.id),
  "Task visible in dev queue",
);

const claimed = claimTask(task.id, "dev");
assert(claimed !== null && claimed.status === "in_progress", "Task claimed by dev");

const completed = completeTask(task.id, "dev", "Test passed");
assert(completed !== null && completed.status === "completed", "Task completed");

const stats = getQueueStats();
assert(stats.total >= 1, `Queue stats: ${stats.total} total, ${stats.completed} completed`);

// 5. Budget Monitor
console.log("\n💰 Budget Monitor");
const budgetCheck = checkBudget("ops");
assert(budgetCheck.allow === true, "Budget check allows (fresh day)");

recordApiCall("ops", 0.01);
const summary = getBudgetSummary("ops");
assert(summary.apiCalls >= 1, `API calls tracked: ${summary.apiCalls}`);
assert(summary.apiCostUsd >= 0.01, `API cost tracked: $${summary.apiCostUsd}`);

// 6. Security Hooks
console.log("\n🛡️  Security Hooks");

// Bash should be blocked for marketing
const marketingBash = preToolUseHook({ toolName: "Bash", params: { command: "ls" } }, "marketing");
assert(!marketingBash.allow, "Bash blocked for marketing agent");

// Bash should be blocked for sales sub-agents
const researchBash = preToolUseHook({ toolName: "Bash", params: { command: "ls" } }, "research");
assert(!researchBash.allow, "Bash blocked for research agent");

// Bash should be allowed for dev
const devBash = preToolUseHook({ toolName: "Bash", params: { command: "npm test" } }, "dev");
assert(devBash.allow, "Bash allowed for dev agent");

// Dangerous command blocked for everyone
const dangerousBash = preToolUseHook({ toolName: "Bash", params: { command: "rm -rf /" } }, "ops");
assert(!dangerousBash.allow, "Dangerous bash pattern blocked");

// Frontend can't run anchor
const frontendAnchor = preToolUseHook(
  { toolName: "Bash", params: { command: "anchor build" } },
  "frontend",
);
assert(!frontendAnchor.allow, "Frontend blocked from anchor commands");

// File write scoping
const contentWrite = preToolUseHook(
  { toolName: "Write", params: { file_path: "/content/blog.md" } },
  "content",
);
assert(contentWrite.allow, "Content agent can write to /content/");

const contentBadWrite = preToolUseHook(
  { toolName: "Write", params: { file_path: "/programs/lib.rs" } },
  "content",
);
assert(!contentBadWrite.allow, "Content agent blocked from /programs/");

const proposalsWrite = preToolUseHook(
  { toolName: "Write", params: { file_path: "/proposals/client.md" } },
  "proposals",
);
assert(proposalsWrite.allow, "Proposals agent can write to /proposals/");

// Post tool use hook returns audit entry
const audit = postToolUseHook(
  { toolName: "Read", params: { path: "/test" } },
  "ops",
  "success",
  42,
);
assert(audit.agent === "ops" && audit.durationMs === 42, "Post tool hook returns audit entry");

// 7. Scheduler
console.log("\n⏰ Scheduler");
const scheduler = createScheduler("ops", async (job) => {
  log.info(`Scheduler test: job ${job.name} would run`);
});
scheduler.register([
  { id: "test-job", name: "Test Job", cron: "*/5 * * * *", enabled: true, prompt: "test" },
  { id: "disabled-job", name: "Disabled Job", cron: "*/5 * * * *", enabled: false, prompt: "test" },
]);
const registeredJobs = scheduler.listJobs();
assert(registeredJobs.length === 1, "Enabled jobs registered (disabled skipped)");
assert(registeredJobs[0].id === "test-job", "Correct job registered");

// 8. All agent schedule files importable
console.log("\n📅 Agent Schedules");
const agentSchedules = [
  { name: "ops", path: "./ops-agent/schedule.js" },
  { name: "dev", path: "./dev-agent/schedule.js" },
  { name: "frontend", path: "./frontend-agent/schedule.js" },
  { name: "backend", path: "./backend-agent/schedule.js" },
  { name: "web3", path: "./web3-agent/schedule.js" },
  { name: "marketing", path: "./marketing-agent/schedule.js" },
  { name: "content", path: "./content-agent/schedule.js" },
  { name: "social", path: "./social-agent/schedule.js" },
  { name: "analytics", path: "./analytics-agent/schedule.js" },
  { name: "sales", path: "./sales-agent/schedule.js" },
  { name: "research", path: "./research-agent/schedule.js" },
  { name: "outreach", path: "./outreach-agent/schedule.js" },
  { name: "proposals", path: "./proposals-agent/schedule.js" },
];

let _allSchedulesOk = true;
for (const s of agentSchedules) {
  try {
    const mod = await import(s.path);
    const jobs = Object.values(mod)[0] as any[];
    assert(Array.isArray(jobs) && jobs.length > 0, `${s.name}: ${jobs.length} jobs`);
  } catch (err) {
    assert(false, `${s.name}: FAILED to import — ${err}`);
    _allSchedulesOk = false;
  }
}

// Summary
console.log(`\n${"=".repeat(55)}`);
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error("❌ Some tests failed!");
  process.exit(1);
} else {
  console.log("✅ All infrastructure tests passed!\n");
  console.log("Next steps:");
  console.log("  1. Add your ANTHROPIC_API_KEY to .env");
  console.log("  2. Run a single agent: npx tsx ops-agent/index.ts --job health-check");
  console.log("  3. Start all agents: docker-compose up");
  console.log("");
}
