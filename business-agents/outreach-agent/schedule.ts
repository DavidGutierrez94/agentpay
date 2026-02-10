import type { ScheduledJob } from "../shared/types.js";

export const outreachJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for outreach tasks assigned to you.

1. Read the task queue for tasks assigned to "outreach" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Work on the task (craft outreach, follow up, respond, etc.)
4. When done, mark the task as completed with a result summary

Focus on tasks from the sales lead first.`,
  },
  {
    id: "outreach-campaign",
    name: "Outreach Campaign",
    cron: "0 11 * * 1,3,5",
    enabled: true,
    prompt: `Send outreach to qualified leads.

1. Read the research agent's CONTEXT.md for newly qualified leads
2. Select 2-3 leads that haven't been contacted yet
3. For each lead, craft a personalized outreach email:
   - Reference their specific project or needs
   - Explain how AgentPay or our dev services can help
   - Include a clear, specific value proposition
   - Keep it short (3-5 sentences max)
4. Log the outreach in the CRM
5. Update your CONTEXT.md

Personalize every message. Show you understand their problem.`,
  },
  {
    id: "follow-up",
    name: "Follow-up Check",
    cron: "0 14 * * *",
    enabled: true,
    prompt: `Follow up on outstanding outreach.

1. Check the CRM for outreach sent more than 3 days ago without response
2. For each, craft a concise follow-up:
   - Reference the original message
   - Add one new piece of value
   - Keep it to 2-3 sentences
3. For leads that responded:
   - Answer any questions
   - If interested, flag for sales lead to take over
4. Log all activity in the CRM
5. Update your CONTEXT.md

Be persistent but not pushy. One follow-up per outreach, then move on.`,
  },
  {
    id: "daily-update",
    name: "Daily Outreach Report",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily outreach status update.

1. Summarize messages sent today
2. Note responses received and their sentiment
3. Flag hot leads for sales lead attention
4. Write the update to your CONTEXT.md

Keep it concise. The sales lead reads this to coordinate the team.`,
  },
];
