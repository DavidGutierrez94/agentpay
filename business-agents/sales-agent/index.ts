#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { initModelProvider } from "../shared/agent-init.js";
import { getBudgetSummary } from "../shared/budget-monitor.js";
import { CONFIG } from "../shared/config.js";
import { appendToAgentContext, readAgentContext } from "../shared/context-store.js";
import { createAgentLogger } from "../shared/logger.js";
import { createScheduler } from "../shared/scheduler.js";
import { listTasks } from "../shared/task-queue.js";
import type { ScheduledJob } from "../shared/types.js";
import { salesJobs } from "./schedule.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createAgentLogger("sales");

const soulPath = path.join(__dirname, "SOUL.md");
const systemPrompt = fs.readFileSync(soulPath, "utf-8");

function buildContext(): string {
  const budget = getBudgetSummary("sales");
  const myTasks = listTasks({ assignedTo: "sales" });
  const pending = myTasks.filter((t) => t.status === "pending");

  // Read specialist contexts
  const specialistStatus: string[] = [];
  for (const specialist of ["research", "outreach", "proposals"] as const) {
    try {
      const ctx = readAgentContext(specialist);
      const lines = ctx.split("\n").slice(-15);
      specialistStatus.push(`#### ${specialist} agent\n${lines.join("\n")}`);
    } catch {
      /* specialist context may not exist yet */
    }
  }

  // Check specialist tasks
  const researchTasks = listTasks({ assignedTo: "research" });
  const outreachTasks = listTasks({ assignedTo: "outreach" });
  const proposalsTasks = listTasks({ assignedTo: "proposals" });

  return `
## Sales Lead State

### My Tasks
- Pending: ${pending.length}
${pending.map((t) => `- [${t.priority}] ${t.title}`).join("\n") || ""}

### Team Tasks
- Research: ${researchTasks.filter((t) => t.status === "pending").length} pending, ${researchTasks.filter((t) => t.status === "in_progress").length} in progress, ${researchTasks.filter((t) => t.status === "completed").length} completed
- Outreach: ${outreachTasks.filter((t) => t.status === "pending").length} pending, ${outreachTasks.filter((t) => t.status === "in_progress").length} in progress, ${outreachTasks.filter((t) => t.status === "completed").length} completed
- Proposals: ${proposalsTasks.filter((t) => t.status === "pending").length} pending, ${proposalsTasks.filter((t) => t.status === "in_progress").length} in progress, ${proposalsTasks.filter((t) => t.status === "completed").length} completed

### Budget Today
- API: $${budget.apiCostUsd.toFixed(4)} | SOL: ${budget.solSpent.toFixed(4)} | Calls: ${budget.apiCalls}

### Specialist Updates
${specialistStatus.join("\n\n") || "No specialist updates yet"}
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
          "Read",
          "Glob",
          "Grep",
          "mcp__agentpay__search_services",
          "mcp__agentpay__get_balance",
          "mcp__agentpay__list_my_tasks",
          "mcp__agentpay__create_task",
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
              AGENTPAY_KEYPAIR: process.env.SALES_KEYPAIR || process.env.AGENTPAY_KEYPAIR || "",
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
    appendToAgentContext("sales", {
      type: "alert",
      author: "sales",
      content: `Job "${job.name}" failed: ${errMsg}`,
    });
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
  logger.info(`Starting sales lead agent in ${mode} mode`);

  if (mode === "job" && jobId) {
    const job = salesJobs.find((j) => j.id === jobId);
    if (!job) {
      logger.error(`Job not found: ${jobId}. Available: ${salesJobs.map((j) => j.id).join(", ")}`);
      process.exit(1);
    }
    await executeJob(job);
    return;
  }

  if (mode === "interactive") {
    await executeJob({
      id: "interactive",
      name: "Interactive",
      cron: "",
      enabled: true,
      prompt:
        prompt || "Review your sales team's status and coordinate pipeline priorities for today.",
    });
    return;
  }

  const scheduler = createScheduler("sales", executeJob);
  scheduler.register(salesJobs);
  scheduler.start();
  logger.info("Sales lead agent daemon running.");

  const shutdown = () => {
    logger.info("Shutting down...");
    scheduler.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {});
}

main().catch((err) => {
  logger.error(`Fatal: ${err}`);
  process.exit(1);
});
