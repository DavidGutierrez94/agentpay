import type { ScheduledJob } from "../shared/types.js";

export const devJobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments & Decompose",
    cron: "*/10 * * * *",
    enabled: true,
    prompt: `Check the task queue for tasks assigned to "dev" (the tech lead).

1. Read the task queue for tasks assigned to "dev" with status "pending"
2. For each task, decide if it should be decomposed into specialist subtasks:
   - Frontend work (UI, components, pages) -> assign to "frontend"
   - Backend work (MCP tools, CLI, APIs, security) -> assign to "backend"
   - Web3 work (Anchor program, ZK circuits, on-chain) -> assign to "web3"
   - Cross-cutting or architectural work -> keep assigned to "dev" and handle yourself
3. Create subtasks for the specialists with clear requirements
4. For tasks you keep, begin working on them

Write your architecture decisions and task decomposition to your CONTEXT.md.`,
  },
  {
    id: "code-review",
    name: "Code Review",
    cron: "0 */3 * * *",
    enabled: true,
    prompt: `Review completed work from your engineering team.

1. Check the task queue for tasks completed by "frontend", "backend", or "web3"
2. For each completed task, review the code:
   - Read the files they changed (check their CONTEXT.md for what they did)
   - Verify correctness and security
   - Check pattern consistency with existing code
   - Ensure tests were written
3. If the work is good, mark the parent task as completed
4. If changes are needed, create a follow-up task for the specialist with feedback
5. Write review notes to your CONTEXT.md

Be constructive. Focus on correctness, security, and maintainability.`,
  },
  {
    id: "team-coordination",
    name: "Team Coordination",
    cron: "0 */4 * * *",
    enabled: true,
    prompt: `Coordinate the engineering team.

1. Read CONTEXT.md for frontend, backend, and web3 agents
2. Check for blocked tasks — can you unblock them?
3. Check for cross-domain dependencies:
   - Does the frontend need a new MCP tool from backend?
   - Does the backend need a new instruction from web3?
   - Does any agent need architecture guidance?
4. If there are cross-domain dependencies, create tasks and document the API contract
5. Update your CONTEXT.md with team status and any decisions made

Focus on unblocking agents and ensuring smooth integration.`,
  },
  {
    id: "ci-check",
    name: "CI Status Check",
    cron: "*/15 * * * *",
    enabled: true,
    prompt: `Check CI/CD status across the entire stack.

1. Run TypeScript compilation check
2. Check for any test failures
3. If CI is broken, identify which domain (frontend/backend/web3) and create a critical task for that specialist
4. Write CI status to your CONTEXT.md

A broken CI is always the top priority.`,
  },
  {
    id: "daily-update",
    name: "Daily Status Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write the daily engineering status report.

1. Read all specialist agents' CONTEXT.md files
2. Summarize:
   - Architecture decisions made today
   - Code reviews completed
   - Tasks delegated and their status
   - Cross-domain integrations in progress
   - Blockers and how they were resolved
3. Flag any technical debt or risks
4. Write to your CONTEXT.md

This report is read by the ops agent, so be clear about what needs attention.`,
  },
  {
    id: "dependency-audit",
    name: "Weekly Dependency Audit",
    cron: "0 8 * * 1",
    enabled: true,
    prompt: `Perform a weekly dependency and architecture audit.

1. Check for outdated npm dependencies across all packages
2. Check for known security vulnerabilities with npm audit
3. Review Rust/Cargo dependencies for the Anchor program
4. If there are critical vulnerabilities, create tasks for the appropriate specialist
5. Review architecture decisions from the past week — any tech debt accumulating?
6. Write audit results to your CONTEXT.md

Don't auto-update — flag for review and create tasks.`,
  },
];
