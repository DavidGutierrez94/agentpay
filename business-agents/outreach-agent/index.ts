#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { CONFIG } from "../shared/config.js";
import { initModelProvider } from "../shared/agent-init.js";
import { createAgentLogger } from "../shared/logger.js";
import { createScheduler } from "../shared/scheduler.js";
import { appendToAgentContext, readAgentContext } from "../shared/context-store.js";
import { listTasks } from "../shared/task-queue.js";
import { getBudgetSummary } from "../shared/budget-monitor.js";
import { outreachJobs } from "./schedule.js";
import type { ScheduledJob } from "../shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createAgentLogger("outreach");

const soulPath = path.join(__dirname, "SOUL.md");
const systemPrompt = fs.readFileSync(soulPath, "utf-8");

function buildContext(): string {
  const budget = getBudgetSummary("outreach");
  const myTasks = listTasks({ assignedTo: "outreach" });
  const pending = myTasks.filter((t) => t.status === "pending");
  const inProgress = myTasks.filter((t) => t.status === "in_progress");

  let salesLeadNotes = "";
  try {
    const ctx = readAgentContext("sales");
    const lines = ctx.split("\n").slice(-15);
    salesLeadNotes = lines.join("\n");
  } catch { /* may not exist */ }

  let researchNotes = "";
  try {
    const ctx = readAgentContext("research");
    const lines = ctx.split("\n").slice(-15);
    researchNotes = lines.join("\n");
  } catch { /* may not exist */ }

  return `
## Outreach Agent State

### My Tasks
- Pending: ${pending.length}
- In Progress: ${inProgress.length}

### Pending Tasks
${pending.map((t) => `- [${t.priority}] ${t.title}: ${t.description}`).join("\n") || "None"}

### In Progress
${inProgress.map((t) => `- [${t.priority}] ${t.title}`).join("\n") || "None"}

### Budget Today
- API: $${budget.apiCostUsd.toFixed(4)} | Calls: ${budget.apiCalls}

### Sales Lead Notes
${salesLeadNotes || "No recent notes"}

### Research Agent Notes (lead profiles)
${researchNotes || "No recent research notes"}
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
        allowedTools: ["Read", "Glob", "Grep"],
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        persistSession: false,
        maxTurns: 25,
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
    appendToAgentContext("outreach", { type: "alert", author: "outreach", content: `Job "${job.name}" failed: ${errMsg}` });
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
  logger.info(`Starting outreach agent in ${mode} mode`);

  if (mode === "job" && jobId) {
    const job = outreachJobs.find((j) => j.id === jobId);
    if (!job) { logger.error(`Job not found: ${jobId}. Available: ${outreachJobs.map((j) => j.id).join(", ")}`); process.exit(1); }
    await executeJob(job);
    return;
  }

  if (mode === "interactive") {
    await executeJob({ id: "interactive", name: "Interactive", cron: "", enabled: true, prompt: prompt || "Check for pending outreach tasks and send personalized messages to qualified leads." });
    return;
  }

  const scheduler = createScheduler("outreach", executeJob);
  scheduler.register(outreachJobs);
  scheduler.start();
  logger.info("Outreach agent daemon running.");
  const shutdown = () => { logger.info("Shutting down..."); scheduler.stop(); process.exit(0); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  await new Promise(() => {});
}

main().catch((err) => { logger.error(`Fatal: ${err}`); process.exit(1); });
