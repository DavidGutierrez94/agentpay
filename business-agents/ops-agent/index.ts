#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { initModelProvider } from "../shared/agent-init.js";
import { getAllBudgetSummaries } from "../shared/budget-monitor.js";
import { CONFIG } from "../shared/config.js";
import { appendToAgentContext } from "../shared/context-store.js";
import { createAgentLogger } from "../shared/logger.js";
import { createScheduler } from "../shared/scheduler.js";
import { getQueueStats, listTasks } from "../shared/task-queue.js";
import type { ScheduledJob } from "../shared/types.js";
import { opsJobs } from "./schedule.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createAgentLogger("ops");

// Load SOUL.md as system prompt
const soulPath = path.join(__dirname, "SOUL.md");
const systemPrompt = fs.readFileSync(soulPath, "utf-8");

// Build context for the agent
function buildContext(): string {
  const budgets = getAllBudgetSummaries();
  const queueStats = getQueueStats();
  const pendingTasks = listTasks({ status: "pending" });
  const blockedTasks = listTasks({ status: "blocked" });

  return `
## Current State

### Task Queue
${JSON.stringify(queueStats, null, 2)}

### Pending Tasks (${pendingTasks.length})
${pendingTasks.map((t) => `- [${t.priority}] ${t.title} -> ${t.assignedTo}`).join("\n") || "None"}

### Blocked Tasks (${blockedTasks.length})
${blockedTasks.map((t) => `- ${t.title} -> ${t.assignedTo}: ${t.blockedReason}`).join("\n") || "None"}

### Budget Today
${budgets.map((b) => `- ${b.agentRole}: $${b.apiCostUsd.toFixed(4)} API | ${b.solSpent.toFixed(4)} SOL | ${b.apiCalls} calls`).join("\n") || "No spend recorded"}
`.trim();
}

// Execute a scheduled job by running a query() call
async function executeJob(job: ScheduledJob): Promise<void> {
  logger.info(`Executing job: ${job.name} (${job.id})`);

  const context = buildContext();
  const fullPrompt = `${job.prompt}\n\n---\n\n${context}`;

  try {
    for await (const message of query({
      prompt: fullPrompt,
      options: {
        systemPrompt,
        model: CONFIG.leaderModel,
        allowedTools: [
          "Read",
          "Write",
          "Glob",
          "Grep",
          "Bash",
          "mcp__agentpay__get_balance",
          "mcp__agentpay__list_my_tasks",
          "mcp__agentpay__get_task",
          "mcp__agentpay__search_services",
          "mcp__agentpay__get_service",
        ],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        persistSession: false,
        maxTurns: 25,
        mcpServers: {
          agentpay: {
            type: "stdio",
            command: "node",
            args: [CONFIG.mcpServerPath],
            env: {
              AGENTPAY_KEYPAIR: process.env.OPS_KEYPAIR || process.env.AGENTPAY_KEYPAIR || "",
              AGENTPAY_RPC: CONFIG.rpcUrl,
            },
          },
        },
        cwd: CONFIG.projectRoot,
      },
    })) {
      // Process messages from the agent
      if (message.type === "assistant" && message.message?.content) {
        for (const block of message.message.content) {
          if (typeof block === "object" && "text" in block) {
            logger.debug(`Agent output: ${block.text.slice(0, 200)}`);
          }
        }
      } else if (message.type === "result") {
        if (message.subtype === "success") {
          logger.info(`Job result: ${message.result.slice(0, 500)}`);
        } else {
          logger.warn(`Job ended: ${message.subtype}`);
        }
      }
    }

    logger.info(`Job completed: ${job.name}`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    logger.error(`Job failed: ${job.name} — ${errMsg}`);

    appendToAgentContext("ops", {
      type: "alert",
      author: "ops",
      content: `Job "${job.name}" failed: ${errMsg}`,
    });
  }
}

// Parse CLI arguments
function parseArgs(): { mode: "daemon" | "job" | "interactive"; jobId?: string; prompt?: string } {
  const args = process.argv.slice(2);

  if (args.includes("--interactive") || args.includes("-i")) {
    const promptIdx = args.indexOf("--prompt");
    const prompt = promptIdx !== -1 ? args[promptIdx + 1] : undefined;
    return { mode: "interactive", prompt };
  }

  const jobIdx = args.indexOf("--job");
  if (jobIdx !== -1 && args[jobIdx + 1]) {
    return { mode: "job", jobId: args[jobIdx + 1] };
  }

  return { mode: "daemon" };
}

async function main(): Promise<void> {
  // Initialize model provider (OpenRouter or Anthropic)
  initModelProvider();

  const { mode, jobId, prompt } = parseArgs();

  logger.info(`Starting ops agent in ${mode} mode`);

  if (mode === "job" && jobId) {
    // Run a single job and exit
    const job = opsJobs.find((j) => j.id === jobId);
    if (!job) {
      logger.error(`Job not found: ${jobId}`);
      logger.info(`Available jobs: ${opsJobs.map((j) => j.id).join(", ")}`);
      process.exit(1);
    }
    await executeJob(job);
    return;
  }

  if (mode === "interactive") {
    // Run an interactive query
    const interactivePrompt =
      prompt || "Check the current status of the AgentPay business team and report.";
    await executeJob({
      id: "interactive",
      name: "Interactive Query",
      cron: "",
      enabled: true,
      prompt: interactivePrompt,
    });
    return;
  }

  // Daemon mode — run scheduler
  const scheduler = createScheduler("ops", executeJob);
  scheduler.register(opsJobs);
  scheduler.start();

  logger.info("Ops agent daemon running. Press Ctrl+C to stop.");

  // Graceful shutdown
  const shutdown = () => {
    logger.info("Shutting down ops agent...");
    scheduler.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep alive
  await new Promise(() => {});
}

main().catch((err) => {
  logger.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
