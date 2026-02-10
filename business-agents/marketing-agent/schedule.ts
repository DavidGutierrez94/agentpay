import type { ScheduledJob } from "../shared/types.js";

export const marketingJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments & Decompose",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for tasks assigned to "marketing" (the marketing lead).

1. Read the task queue for tasks assigned to "marketing" with status "pending"
2. For each task, decide if it should be decomposed into specialist subtasks:
   - Content work (blog posts, tutorials, documentation) -> assign to "content"
   - Social media work (tweets, engagement, community) -> assign to "social"
   - Analytics work (metrics tracking, reporting) -> assign to "analytics"
   - Strategy or cross-cutting work -> keep assigned to "marketing" and handle yourself
3. Create subtasks for the specialists with clear requirements and deadlines
4. For tasks you keep, begin working on them

Write your strategy decisions and task decomposition to your CONTEXT.md.`,
  },
  {
    id: "content-review",
    name: "Content Review",
    cron: "0 */4 * * *",
    enabled: true,
    prompt: `Review completed work from your marketing team.

1. Check the task queue for tasks completed by "content", "social", or "analytics"
2. For each completed task, review the output:
   - Read the content they created (check their CONTEXT.md for what they did)
   - Verify accuracy (cross-reference with dev context for technical content)
   - Check brand voice consistency
   - Ensure it aligns with current strategy
3. If the work is good, mark the parent task as completed
4. If changes are needed, create a follow-up task for the specialist with feedback
5. Write review notes to your CONTEXT.md

Focus on accuracy, authenticity, and developer-first voice.`,
  },
  {
    id: "team-coordination",
    name: "Team Coordination",
    cron: "0 */6 * * *",
    enabled: true,
    prompt: `Coordinate the marketing team.

1. Read CONTEXT.md for content, social, and analytics agents
2. Check for blocked tasks — can you unblock them?
3. Check for cross-channel dependencies:
   - Does content need social promotion?
   - Does social need new content to share?
   - Does analytics need new tracking for a campaign?
4. Check dev context for new features to announce
5. Update your CONTEXT.md with team status and strategy adjustments

Focus on ensuring the team is aligned and productive.`,
  },
  {
    id: "strategy-review",
    name: "Weekly Strategy Review",
    cron: "0 9 * * 1",
    enabled: true,
    prompt: `Conduct the weekly marketing strategy review.

1. Read analytics agent's latest metrics report
2. Read content agent's output summary
3. Read social agent's engagement report
4. Evaluate what's working:
   - Which content types drive the most engagement?
   - Which channels are growing fastest?
   - What topics resonate with our audience?
5. Adjust strategy for the coming week:
   - Set content priorities
   - Identify campaign opportunities
   - Plan any coordinated launches with dev team
6. Write the strategy update to your CONTEXT.md
7. Create tasks for each specialist for the week

Data-driven decisions. Double down on what works.`,
  },
  {
    id: "daily-standup",
    name: "Daily Marketing Standup",
    cron: "0 9 * * *",
    enabled: true,
    prompt: `Run the daily marketing team standup.

1. Read all specialist agents' CONTEXT.md files (content, social, analytics)
2. Summarize:
   - Content created/published yesterday
   - Social engagement metrics
   - Any analytics insights
   - Blocked tasks
3. Check the ops agent's CONTEXT.md for business priorities
4. Check the dev agent's CONTEXT.md for feature updates to announce
5. Set today's priorities for each specialist
6. Write the standup summary to your CONTEXT.md

This report is read by the ops agent, so be clear about what needs attention.`,
  },
];
