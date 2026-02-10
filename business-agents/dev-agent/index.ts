#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { CONFIG } from "../shared/config.js";
import { initModelProvider } from "../shared/agent-init.js";
import { createAgentLogger } from "../shared/logger.js";
import { createScheduler } from "../shared/scheduler.js";
import { appendToAgentContext } from "../shared/context-store.js";
import { listTasks, getQueueStats } from "../shared/task-queue.js";
import { getBudgetSummary } from "../shared/budget-monitor.js";
import { devJobs } from "./schedule.js";
import type { ScheduledJob } from "../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createAgentLogger("dev");

const soulPath = path.join(__dirname, "SOUL.md");
const systemPrompt = fs.readFileSync(soulPath, "utf-8");

function buildContext(): string {
  const budget = getBudgetSummary("dev");
  const myTasks = listTasks({ assignedTo: "dev" });
  const pending = myTasks.filter((t) => t.status === "pending");
  const inProgress = myTasks.filter((t) => t.status === "in_progress");

  return `
## Dev Agent State

### My Tasks
- Pending: ${pending.length}
- In Progress: ${inProgress.length}

### Pending Tasks
${pending.map((t) => `- [${t.priority}] ${t.title}: ${t.description}`).join("\n") || "None"}

### In Progress
${inProgress.map((t) => `- [${t.priority}] ${t.title}: ${t.description}`).join("\n") || "None"}

### Budget Today
- API: $${budget.apiCostUsd.toFixed(4)} | SOL: ${budget.solSpent.toFixed(4)} | Calls: ${budget.apiCalls}
`.trim();
}

async function executeJob(job: ScheduledJob): Promise<void> {
  logger.info(`Executing job: ${job.name}`);

  const context = buildContext();
  const fullPrompt = `${job.prompt}\n\n---\n\n${context}`;

  try {
    for await (const message of query({
      prompt: fullPrompt,
      options: {
        systemPrompt,
        model: CONFIG.defaultModel,
        allowedTools: [
          "Read", "Write", "Edit", "Glob", "Grep", "Bash",
          "mcp__agentpay__get_balance",
          "mcp__agentpay__list_my_tasks",
          "mcp__agentpay__get_task",
          "mcp__agentpay__submit_result_zk",
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
              AGENTPAY_KEYPAIR: process.env.DEV_KEYPAIR || process.env.AGENTPAY_KEYPAIR || "",
              AGENTPAY_RPC: CONFIG.rpcUrl,
            },
          },
        },
        cwd: CONFIG.projectRoot,
      },
    })) {
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
    appendToAgentContext("dev", { type: "alert", author: "dev", content: `Job "${job.name}" failed: ${errMsg}` });
  }
}

function parseArgs(): { mode: "daemon" | "job" | "interactive"; jobId?: string; prompt?: string } {
  const args = process.argv.slice(2);
  if (args.includes("--interactive") || args.includes("-i")) {
    const promptIdx = args.indexOf("--prompt");
    return { mode: "interactive", prompt: promptIdx !== -1 ? args[promptIdx + 1] : undefined };
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
  logger.info(`Starting dev agent in ${mode} mode`);

  if (mode === "job" && jobId) {
    const job = devJobs.find((j) => j.id === jobId);
    if (!job) {
      logger.error(`Job not found: ${jobId}. Available: ${devJobs.map((j) => j.id).join(", ")}`);
      process.exit(1);
    }
    await executeJob(job);
    return;
  }

  if (mode === "interactive") {
    await executeJob({
      id: "interactive", name: "Interactive", cron: "", enabled: true,
      prompt: prompt || "Check for pending dev tasks and work on the highest priority one.",
    });
    return;
  }

  const scheduler = createScheduler("dev", executeJob);
  scheduler.register(devJobs);
  scheduler.start();
  logger.info("Dev agent daemon running.");

  const shutdown = () => { logger.info("Shutting down..."); scheduler.stop(); process.exit(0); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {});
}

main().catch((err) => { logger.error(`Fatal: ${err}`); process.exit(1); });
