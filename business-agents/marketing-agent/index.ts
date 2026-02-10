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
import { marketingJobs } from "./schedule.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createAgentLogger("marketing");

const soulPath = path.join(__dirname, "SOUL.md");
const systemPrompt = fs.readFileSync(soulPath, "utf-8");

function buildContext(): string {
  const budget = getBudgetSummary("marketing");
  const myTasks = listTasks({ assignedTo: "marketing" });
  const pending = myTasks.filter((t) => t.status === "pending");

  // Read specialist contexts
  const specialistStatus: string[] = [];
  for (const specialist of ["content", "social", "analytics"] as const) {
    try {
      const ctx = readAgentContext(specialist);
      const lines = ctx.split("\n").slice(-15);
      specialistStatus.push(`#### ${specialist} agent\n${lines.join("\n")}`);
    } catch {
      /* specialist context may not exist yet */
    }
  }

  // Read dev context for feature announcements
  let devUpdates = "";
  try {
    const devCtx = readAgentContext("dev");
    const lines = devCtx.split("\n").slice(-15);
    devUpdates = lines.join("\n");
  } catch {
    /* dev context may not exist yet */
  }

  // Check specialist tasks
  const contentTasks = listTasks({ assignedTo: "content" });
  const socialTasks = listTasks({ assignedTo: "social" });
  const analyticsTasks = listTasks({ assignedTo: "analytics" });

  return `
## Marketing Lead State

### My Tasks
- Pending: ${pending.length}
${pending.map((t) => `- [${t.priority}] ${t.title}`).join("\n") || ""}

### Team Tasks
- Content: ${contentTasks.filter((t) => t.status === "pending").length} pending, ${contentTasks.filter((t) => t.status === "in_progress").length} in progress, ${contentTasks.filter((t) => t.status === "completed").length} completed
- Social: ${socialTasks.filter((t) => t.status === "pending").length} pending, ${socialTasks.filter((t) => t.status === "in_progress").length} in progress, ${socialTasks.filter((t) => t.status === "completed").length} completed
- Analytics: ${analyticsTasks.filter((t) => t.status === "pending").length} pending, ${analyticsTasks.filter((t) => t.status === "in_progress").length} in progress, ${analyticsTasks.filter((t) => t.status === "completed").length} completed

### Budget Today
- API: $${budget.apiCostUsd.toFixed(4)} | Calls: ${budget.apiCalls}

### Specialist Updates
${specialistStatus.join("\n\n") || "No specialist updates yet"}

### Dev Updates (for content coordination)
${devUpdates || "No recent dev updates"}
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
              AGENTPAY_KEYPAIR: process.env.MARKETING_KEYPAIR || process.env.AGENTPAY_KEYPAIR || "",
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
    appendToAgentContext("marketing", {
      type: "alert",
      author: "marketing",
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
  logger.info(`Starting marketing lead agent in ${mode} mode`);

  if (mode === "job" && jobId) {
    const job = marketingJobs.find((j) => j.id === jobId);
    if (!job) {
      logger.error(
        `Job not found: ${jobId}. Available: ${marketingJobs.map((j) => j.id).join(", ")}`,
      );
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
      prompt: prompt || "Review your marketing team's status and coordinate priorities for today.",
    });
    return;
  }

  const scheduler = createScheduler("marketing", executeJob);
  scheduler.register(marketingJobs);
  scheduler.start();
  logger.info("Marketing lead agent daemon running.");

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
