import type { ScheduledJob } from "../shared/types.js";

export const contentJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for content tasks assigned to you.

1. Read the task queue for tasks assigned to "content" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Work on the task (blog post, tutorial, documentation, etc.)
4. When done, mark the task as completed with a result summary

Focus on tasks from the marketing lead first.`,
  },
  {
    id: "content-creation",
    name: "Content Creation",
    cron: "0 10 * * 1,3,5",
    enabled: true,
    prompt: `Create a new piece of long-form content for AgentPay.

1. Check the marketing lead's CONTEXT.md for content priorities
2. Choose a topic from assigned tasks or content calendar
3. Research by reading relevant code, documentation, and dev context
4. Write the content:
   - For blog posts: 800-1500 words, technical, with code examples
   - For tutorials: step-by-step with working code snippets
   - For threads: 6-10 tweet-sized insights with a narrative arc
5. Save the content to /content/ directory
6. Update your CONTEXT.md with what you created and key points

Make it genuinely useful to developers. Include code examples from the actual codebase when relevant.`,
  },
  {
    id: "daily-update",
    name: "Daily Status Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily content status update.

1. Summarize content you worked on today
2. Note any research or drafts in progress
3. Flag any topics that need technical input from the dev team
4. Write the update to your CONTEXT.md

Keep it concise. The marketing lead reads this to coordinate the team.`,
  },
];
