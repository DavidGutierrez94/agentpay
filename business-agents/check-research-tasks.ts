#!/usr/bin/env node

import { listTasks } from "./shared/task-queue.js";
import type { AgentTask } from "./shared/types.js";

/**
 * Script to check for pending tasks assigned to "research"
 * Filters by assignedTo: "research" and status: "pending"
 * Results are automatically sorted by priority (critical > high > medium > low)
 */

function main() {
  console.log("🔍 Checking AgentPay task queue for pending research tasks...\n");

  try {
    // Use listTasks with filters for research agent and pending status
    const researchTasks: AgentTask[] = listTasks({
      assignedTo: "research",
      status: "pending",
    });

    if (researchTasks.length === 0) {
      console.log("✅ No pending tasks found for research agent.");
      console.log("The research queue is currently empty.\n");
      return;
    }

    console.log(`📋 Found ${researchTasks.length} pending task(s) for research agent:\n`);

    // Display tasks in a formatted table
    researchTasks.forEach((task, index) => {
      const priorityEmoji = {
        critical: "🔴",
        high: "🟠",
        medium: "🟡",
        low: "🟢",
      }[task.priority];

      console.log(`${index + 1}. ${priorityEmoji} [${task.priority.toUpperCase()}] ${task.title}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Description: ${task.description}`);
      console.log(`   Assigned by: ${task.assignedBy}`);
      console.log(`   Created: ${new Date(task.createdAt).toLocaleString()}`);
      console.log(`   Tags: ${task.tags.length > 0 ? task.tags.join(", ") : "None"}`);
      if (task.dueDate) {
        console.log(`   Due: ${new Date(task.dueDate).toLocaleString()}`);
      }
      console.log("");
    });

    // Summary by priority
    const priorityCounts = researchTasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("📊 Priority breakdown:");
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const priorityEmoji = {
        critical: "🔴",
        high: "🟠",
        medium: "🟡",
        low: "🟢",
      }[priority as keyof typeof priorityEmoji];
      console.log(`   ${priorityEmoji} ${priority}: ${count} task(s)`);
    });
  } catch (error) {
    console.error("❌ Error checking research tasks:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
