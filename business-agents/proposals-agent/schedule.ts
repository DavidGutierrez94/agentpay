import type { ScheduledJob } from "../shared/types.js";

export const proposalsJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for proposal tasks assigned to you.

1. Read the task queue for tasks assigned to "proposals" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Work on the task (write proposal, revise proposal, scope project, etc.)
4. When done, mark the task as completed with a result summary

Focus on tasks from the sales lead first.`,
  },
  {
    id: "proposal-work",
    name: "Proposal Work Session",
    cron: "0 10 * * 1,3,5",
    enabled: true,
    prompt: `Work on proposals for qualified opportunities.

1. Check the outreach agent's CONTEXT.md for leads ready for proposals
2. Read the dev agent's CONTEXT.md to understand current team capacity
3. For each opportunity:
   - Research the client's needs (read research agent's CONTEXT.md)
   - Scope the technical work by reading relevant code
   - Estimate timeline based on complexity and team capacity
   - Price in SOL (consider market rate, value delivered, team costs)
   - Write the full proposal following the standard structure
4. Save the proposal to /proposals/ directory
5. Update your CONTEXT.md with the proposal summary and status

Be accurate. Over-promising damages our reputation.`,
  },
  {
    id: "proposal-tracking",
    name: "Proposal Status Check",
    cron: "0 14 * * *",
    enabled: true,
    prompt: `Check on the status of outstanding proposals.

1. Read the sales lead's CONTEXT.md for proposal feedback
2. Check if any proposals need revisions
3. For proposals with feedback, make the requested changes
4. Update your CONTEXT.md with current proposal statuses

Keep proposals moving. Don't let them sit without action.`,
  },
  {
    id: "daily-update",
    name: "Daily Proposals Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily proposals status update.

1. Summarize proposals worked on today
2. Note any proposals submitted, revised, or accepted
3. Flag any that need dev team input for scoping
4. Write the update to your CONTEXT.md

Keep it concise. The sales lead reads this to coordinate the team.`,
  },
];
