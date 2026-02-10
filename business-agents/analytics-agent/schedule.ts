import type { ScheduledJob } from "../shared/types.js";

export const analyticsJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for analytics tasks assigned to you.

1. Read the task queue for tasks assigned to "analytics" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Work on the task (metrics compilation, analysis, reporting, etc.)
4. When done, mark the task as completed with a result summary

Focus on tasks from the marketing lead first.`,
  },
  {
    id: "daily-metrics",
    name: "Daily Metrics Snapshot",
    cron: "0 19 * * *",
    enabled: true,
    prompt: `Compile the daily marketing metrics snapshot.

1. Read the social agent's CONTEXT.md for today's engagement data
2. Read the content agent's CONTEXT.md for content output
3. Pull protocol metrics via AgentPay MCP tools:
   - Number of registered services
   - Tasks created today
   - SOL volume
4. Write a concise daily snapshot to your CONTEXT.md:
   - Social engagement summary
   - Content published
   - Protocol usage metrics
   - Any notable trends or anomalies

Keep it data-focused. Numbers and trends, not opinions.`,
  },
  {
    id: "weekly-report",
    name: "Weekly Analytics Report",
    cron: "0 8 * * 1",
    enabled: true,
    prompt: `Compile the comprehensive weekly marketing analytics report.

1. Aggregate daily snapshots from the past week
2. Calculate week-over-week trends:
   - Social engagement rate (up/down %)
   - Content performance (which pieces performed best)
   - Protocol adoption metrics
   - Follower/community growth
3. Correlation analysis:
   - Did high-engagement content correlate with protocol usage?
   - Which content pillars drive the most conversions?
4. Provide 3-5 actionable recommendations for the marketing lead
5. Write the full report to your CONTEXT.md

Make recommendations specific and data-backed. "Increase tutorial content by 2x because tutorials drove 60% more protocol sign-ups than thought pieces."`,
  },
  {
    id: "protocol-metrics",
    name: "Protocol Metrics Check",
    cron: "0 */6 * * *",
    enabled: true,
    prompt: `Pull and analyze on-chain protocol metrics.

1. Use AgentPay MCP tools to gather protocol data:
   - Total services registered
   - Active tasks
   - Completed tasks
   - SOL volume
   - Unique wallets interacting
2. Compare against previous data points in your CONTEXT.md
3. Flag any significant changes (>20% increase/decrease)
4. Write metrics to your CONTEXT.md

This data is used by marketing lead for content decisions and by ops for business reporting.`,
  },
];
