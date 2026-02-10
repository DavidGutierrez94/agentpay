import type { ScheduledJob } from "../shared/types.js";

export const researchJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for research tasks assigned to you.

1. Read the task queue for tasks assigned to "research" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Work on the task (lead research, qualification, CRM update, etc.)
4. When done, mark the task as completed with a result summary

Focus on tasks from the sales lead first.`,
  },
  {
    id: "lead-research",
    name: "Lead Research",
    cron: "0 */4 * * *",
    enabled: true,
    prompt: `Research potential clients in the AI agent / Solana ecosystem.

1. Search for companies and projects building:
   - AI agent systems (need payment infrastructure)
   - Multi-agent orchestration platforms
   - Solana-based applications (need smart contract development)
   - Crypto projects needing ZK proof integration
2. Qualify each lead against the criteria:
   - Need: Do they have a real need for our services?
   - Budget: Can they pay? (check if they have funding/revenue)
   - Fit: Is this a good match for our capabilities?
   - Timing: Are they actively looking?
3. Add qualified leads to the CRM with detailed profiles
4. Write research notes to your CONTEXT.md

Quality over quantity. Deep research > surface-level lists.`,
  },
  {
    id: "daily-update",
    name: "Daily Research Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily research status update.

1. Summarize leads researched today
2. Note which were qualified and which were rejected (and why)
3. Flag any trends or opportunities in the market
4. Write the update to your CONTEXT.md

Keep it concise. The sales lead reads this to coordinate the team.`,
  },
];
