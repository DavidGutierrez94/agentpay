import type { ScheduledJob } from "../shared/types.js";

export const socialJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check the task queue for social media tasks assigned to you.

1. Read the task queue for tasks assigned to "social" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Work on the task (tweet, thread, engagement, etc.)
4. When done, mark the task as completed with a result summary

Focus on tasks from the marketing lead first.`,
  },
  {
    id: "daily-post",
    name: "Daily Post",
    cron: "0 11 * * *",
    enabled: true,
    prompt: `Create and post the daily tweet about AgentPay.

1. Check the dev agent's CONTEXT.md for any new features or fixes to announce
2. Check the marketing lead's CONTEXT.md for content priorities
3. Pull protocol stats using AgentPay MCP tools (services count, task volume, etc.)
4. Craft a tweet that's informative and engaging — use real data when possible
5. Post the tweet

Content ideas:
- New feature announcements
- Protocol stats and milestones
- Technical insights about ZK proofs or agent payments
- Community highlights
- Development progress updates

Keep it authentic. Developer audience. No empty hype.`,
  },
  {
    id: "community-engage",
    name: "Community Engagement",
    cron: "0 */3 * * *",
    enabled: true,
    prompt: `Engage with the community on Twitter/X.

1. Check for mentions of AgentPay, agent payments, or related topics
2. Reply to relevant conversations with helpful, authentic responses
3. Like and retweet quality content from the Solana/AI agent community
4. Look for opportunities to share AgentPay's capabilities naturally

Be genuine. Don't spam. Add value to conversations.`,
  },
  {
    id: "daily-update",
    name: "Daily Engagement Report",
    cron: "0 18 * * *",
    enabled: true,
    prompt: `Write your daily social media report.

1. Summarize today's posts and engagement
2. Note mentions, replies, and conversations joined
3. Track follower growth if visible
4. Flag any notable conversations or opportunities
5. Write the report to your CONTEXT.md

Keep it concise. The marketing lead and analytics agent read this.`,
  },
];
