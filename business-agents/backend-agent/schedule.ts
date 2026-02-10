import type { ScheduledJob } from "../shared/types.js";

export const backendJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/10 * * * *",
    enabled: true,
    prompt: `Check the task queue for backend tasks assigned to you.

1. Read the task queue for tasks assigned to "backend" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Read the dev lead's CONTEXT.md for architecture notes and API contracts
4. Implement the tool/feature following existing MCP patterns:
   - Export toolDefinitions array + handlers map
   - Add input validation
   - Add rate limiting
   - Add audit logging
5. Test the tool works via the CLI
6. When done, mark task as completed
7. If blocked, mark with reason

ALWAYS follow the pattern in mcp-server/tools/services.mjs.`,
  },
  {
    id: "mcp-work",
    name: "MCP Server Development",
    cron: "0 */2 * * *",
    enabled: true,
    prompt: `Work on MCP server development.

1. Check your CONTEXT.md for current priority
2. If no priority, check task queue for backend tasks
3. Implement MCP tools following existing patterns:
   - Tool definitions in tools/ directory
   - Register in index.mjs (add to ALL_TOOLS and TOOL_HANDLERS)
   - Input validation in security/input-validator.mjs
   - Rate limiting in security/rate-limiter.mjs
4. Test with the CLI to verify tool output is valid JSON
5. Update your CONTEXT.md

Focus on security and backwards compatibility.`,
  },
  {
    id: "daily-update",
    name: "Daily Status Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily status update.

1. Summarize what you built (new MCP tools, CLI commands, security improvements)
2. Note new API contracts for frontend or web3 to consume
3. Flag any security concerns
4. Write to your CONTEXT.md

The dev lead reads this to coordinate integration.`,
  },
];
