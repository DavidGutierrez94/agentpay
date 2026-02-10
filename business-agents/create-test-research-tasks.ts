#!/usr/bin/env node

import { createTask } from "./shared/task-queue.js";

/**
 * Script to create some test tasks for the research agent
 * This demonstrates the task creation functionality
 */

function main() {
  console.log("🧪 Creating test tasks for research agent...\n");

  try {
    // Create some sample research tasks with different priorities
    const testTasks = [
      {
        title: "Market Analysis for Q1 2026",
        description:
          "Conduct comprehensive market research for fintech trends in Q1 2026, focusing on payment processors and Web3 integrations",
        assignedTo: "research" as const,
        assignedBy: "sales" as const,
        priority: "high" as const,
        tags: ["market-analysis", "fintech", "web3"],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
      {
        title: "Competitor Analysis - Payment Solutions",
        description:
          "Research top 5 competitors in the payment solutions space, analyze their pricing models, features, and market positioning",
        assignedTo: "research" as const,
        assignedBy: "marketing" as const,
        priority: "medium" as const,
        tags: ["competitor-analysis", "payments", "pricing"],
      },
      {
        title: "Customer Feedback Analysis",
        description:
          "Analyze recent customer feedback and support tickets to identify pain points and improvement opportunities",
        assignedTo: "research" as const,
        assignedBy: "ops" as const,
        priority: "critical" as const,
        tags: ["customer-feedback", "analysis", "improvement"],
      },
      {
        title: "Industry Compliance Requirements",
        description:
          "Research latest PCI DSS and financial compliance requirements that may impact our payment processing features",
        assignedTo: "research" as const,
        assignedBy: "ops" as const,
        priority: "low" as const,
        tags: ["compliance", "pci-dss", "regulatory"],
      },
    ];

    testTasks.forEach((taskData, index) => {
      const task = createTask(taskData);
      console.log(`✅ Created task ${index + 1}: "${task.title}" [${task.priority}]`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Assigned by: ${task.assignedBy}`);
      console.log("");
    });

    console.log(`🎉 Successfully created ${testTasks.length} test tasks for research agent!`);
    console.log("Run 'npx tsx check-research-tasks.ts' to see them in the queue.\n");
  } catch (error) {
    console.error("❌ Error creating test tasks:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
