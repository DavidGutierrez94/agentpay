import type { ScheduledJob } from "../shared/types.js";

export const salesJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments & Decompose",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for tasks assigned to "sales" (the sales lead).

1. Read the task queue for tasks assigned to "sales" with status "pending"
2. For each task, decide if it should be decomposed into specialist subtasks:
   - Lead identification/qualification work -> assign to "research"
   - Outreach/email/follow-up work -> assign to "outreach"
   - Proposal writing/scoping work -> assign to "proposals"
   - Pipeline strategy or deal closing -> keep assigned to "sales" and handle yourself
3. Create subtasks for the specialists with clear requirements
4. For tasks you keep, begin working on them

Write your pipeline strategy and task decomposition to your CONTEXT.md.`,
  },
  {
    id: "pipeline-review",
    name: "Pipeline Review",
    cron: "0 9 * * *",
    enabled: true,
    prompt: `Review the full sales pipeline for today.

1. Read research agent's CONTEXT.md for new qualified leads
2. Read outreach agent's CONTEXT.md for response data
3. Read proposals agent's CONTEXT.md for proposal statuses
4. Compile pipeline health:
   - New leads in funnel
   - Active outreach conversations
   - Outstanding proposals
   - Deals close to closing
5. Set today's priorities for each specialist
6. Update your CONTEXT.md with the pipeline status

Stay organized. Keep the pipeline moving forward.`,
  },
  {
    id: "output-review",
    name: "Review Team Output",
    cron: "0 */4 * * *",
    enabled: true,
    prompt: `Review completed work from your sales team.

1. Check the task queue for tasks completed by "research", "outreach", or "proposals"
2. For each completed task:
   - Research: verify lead quality and qualification criteria
   - Outreach: review message personalization and accuracy
   - Proposals: verify scope accuracy, pricing, and timeline
3. If the work is good, mark the parent task as completed
4. If changes are needed, create a follow-up task with feedback
5. Write review notes to your CONTEXT.md

Focus on quality. Bad outreach or inaccurate proposals damage our reputation.`,
  },
  {
    id: "team-coordination",
    name: "Team Coordination",
    cron: "0 */6 * * *",
    enabled: true,
    prompt: `Coordinate the sales team.

1. Read CONTEXT.md for research, outreach, and proposals agents
2. Check for blocked tasks — can you unblock them?
3. Check for pipeline dependencies:
   - Does outreach need new leads from research?
   - Does proposals need outreach-qualified opportunities?
   - Does any agent need technical input from dev team?
4. Check ops context for business priorities and capacity updates
5. Update your CONTEXT.md with team status

Focus on pipeline velocity. Move leads through stages efficiently.`,
  },
  {
    id: "weekly-pipeline",
    name: "Weekly Pipeline Report",
    cron: "0 10 * * 5",
    enabled: true,
    prompt: `Generate the weekly sales pipeline report.

1. Compile pipeline metrics from all three specialists:
   - New leads identified (research)
   - Outreach sent and response rates (outreach)
   - Proposals sent and acceptance rates (proposals)
   - Deals closed (won/lost) and revenue
2. Calculate conversion rates at each stage
3. Analyze what's working and what needs adjustment
4. Set targets for next week
5. Write the report to your CONTEXT.md
6. Flag any deals close to closing for ops awareness

Keep it honest. Bad weeks happen. Focus on what to improve.`,
  },
  {
    id: "daily-standup",
    name: "Daily Sales Standup",
    cron: "0 9 * * *",
    enabled: true,
    prompt: `Run the daily sales team standup.

1. Read all specialist agents' CONTEXT.md files (research, outreach, proposals)
2. Summarize:
   - New leads qualified yesterday
   - Outreach sent and responses received
   - Proposals submitted or in progress
   - Deals progressed or closed
   - Blocked tasks
3. Check ops agent's CONTEXT.md for business priorities
4. Check dev agent's CONTEXT.md for capacity and feature updates
5. Set today's priorities for each specialist
6. Write the standup summary to your CONTEXT.md

This report is read by the ops agent, so be clear about pipeline health.`,
  },
];
