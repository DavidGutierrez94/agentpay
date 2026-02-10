import type { ScheduledJob } from "../shared/types.js";

export const frontendJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/10 * * * *",
    enabled: true,
    prompt: `Check the task queue for frontend tasks assigned to you.

1. Read the task queue for tasks assigned to "frontend" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Read the dev lead's CONTEXT.md for any architecture notes or API contracts relevant to your task
4. Implement the feature — read existing components first, follow the patterns
5. When done, mark the task as completed with a summary of what you changed
6. If blocked (e.g., need a new MCP tool from backend), mark as blocked with a reason

Always read existing code before writing new code.`,
  },
  {
    id: "ui-work",
    name: "UI Implementation",
    cron: "0 */2 * * *",
    enabled: true,
    prompt: `Work on UI implementation for AgentPay.

1. Check your CONTEXT.md for current priority
2. If no priority, check task queue for frontend tasks
3. Implement the UI feature following existing patterns:
   - Use shadcn/ui components from the component library
   - Follow the Tailwind CSS v4 patterns already in the codebase
   - Use Zustand for client state, TanStack Query for server state
   - Ensure mobile responsiveness with Tailwind breakpoints
4. Test your changes visually
5. Update your CONTEXT.md with what you built and any integration needs

Remember: components should be accessible, responsive, and performant.`,
  },
  {
    id: "daily-update",
    name: "Daily Status Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily status update.

1. Summarize what you built today (files changed, components created)
2. Note any integration needs (new API endpoints, MCP tools needed)
3. Flag blockers
4. Write to your CONTEXT.md

The dev lead reads this to coordinate the team.`,
  },
];
