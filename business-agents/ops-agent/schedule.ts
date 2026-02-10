import type { ScheduledJob } from "../shared/types.js";

export const opsJobs: ScheduledJob[] = [
  {
    id: "health-check",
    name: "Health Check",
    cron: "*/5 * * * *",
    enabled: true,
    prompt: `Run a health check on the AgentPay business team:

1. Read the shared task queue and report on pending/in-progress/blocked tasks
2. Check budget spending for all agents today (ops, dev, marketing, sales)
3. Check the protocol status using the AgentPay MCP tools:
   - Run get_balance to check our SOL balance
   - Run list_my_tasks to see active tasks on-chain
4. Write a brief health status to your CONTEXT.md

If any agent has exceeded 80% of their daily budget, flag it as a warning.
If any tasks have been blocked for more than 24 hours, escalate them.`,
  },
  {
    id: "cost-audit",
    name: "Cost Audit",
    cron: "0 */6 * * *",
    enabled: true,
    prompt: `Perform a cost audit for the AgentPay business:

1. Check today's budget records for all agents
2. Calculate total API spend and SOL spend
3. Compare against daily and weekly budgets
4. Check SOL balances for all agent wallets using get_balance
5. Write a cost report to your CONTEXT.md

Flag any concerning trends (increasing costs, low SOL balances, etc.).`,
  },
  {
    id: "daily-standup",
    name: "Daily Standup",
    cron: "0 9 * * *",
    enabled: true,
    prompt: `Conduct the daily standup for the AgentPay business team:

1. Read each agent's CONTEXT.md (dev, marketing, sales) to understand what they did yesterday
2. Read the global CONTEXT.md for any broadcasts or decisions
3. Review the task queue:
   - What tasks were completed yesterday?
   - What tasks are in progress?
   - What tasks are blocked?
4. Check protocol metrics using AgentPay MCP tools
5. Based on the above, create new tasks and assign priorities:
   - Assign dev tasks for the day
   - Assign marketing tasks for the day
   - Review sales pipeline tasks
6. Write the daily plan to the global CONTEXT.md
7. Write your standup summary to your own CONTEXT.md`,
  },
  {
    id: "daily-report",
    name: "Daily Report",
    cron: "0 18 * * *",
    enabled: true,
    prompt: `Generate the end-of-day report for the AgentPay business:

1. Read all agent CONTEXT.md files for today's updates
2. Compile task completions and outcomes
3. Summarize:
   - Tasks completed vs planned
   - Budget spent today (API + SOL)
   - Protocol activity (new services, tasks, volume)
   - Sales pipeline changes
   - Any incidents or alerts
4. Write the daily report to the global CONTEXT.md
5. If there are any items requiring human attention, highlight them clearly`,
  },
  {
    id: "weekly-planning",
    name: "Weekly Planning",
    cron: "0 10 * * 1",
    enabled: true,
    prompt: `Conduct weekly planning for the AgentPay business:

1. Review the past week:
   - All completed tasks
   - Total spend (API + SOL)
   - Protocol growth metrics
   - Sales pipeline progression
   - Marketing performance
2. Identify what went well and what needs improvement
3. Set goals for this week:
   - Dev: which features or client work to prioritize
   - Marketing: content calendar, engagement targets
   - Sales: outreach targets, pipeline goals
4. Create tasks for the week in the task queue
5. Write the weekly plan to the global CONTEXT.md
6. Flag any strategic decisions needing human input`,
  },
];
