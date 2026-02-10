import type { ScheduledJob } from "../shared/types.js";

export const web3Jobs: ScheduledJob[] = [
  {
    id: "check-assignments",
    name: "Check Assignments",
    cron: "*/10 * * * *",
    enabled: true,
    prompt: `Check the task queue for web3 tasks assigned to you.

1. Read the task queue for tasks assigned to "web3" with status "pending"
2. If there are pending tasks, claim the highest-priority one
3. Read the dev lead's CONTEXT.md for architecture notes and PDA/instruction specs
4. Implement the on-chain change:
   - Follow existing Anchor patterns in programs/agentpay/
   - Run the security checklist before submitting
   - Write tests for every new instruction
5. When done, mark task as completed with security checklist results
6. If blocked, mark with reason

Security is paramount. Every submission must pass the security checklist.`,
  },
  {
    id: "onchain-work",
    name: "On-Chain Development",
    cron: "0 */2 * * *",
    enabled: true,
    prompt: `Work on Solana program and ZK circuit development.

1. Check your CONTEXT.md for current priority
2. If no priority, check task queue for web3 tasks
3. Implement the on-chain feature:
   - New instructions: define accounts struct, handler, error codes
   - ZK circuits: define signals, constraints, test with edge cases
   - Tests: write Anchor integration tests for happy and failure paths
4. Run the security checklist:
   - [ ] Signers validated
   - [ ] Account ownership checked
   - [ ] PDAs correctly derived
   - [ ] No overflow/underflow
   - [ ] Valid state transitions only
5. Build and test: anchor build && anchor test
6. Update your CONTEXT.md

Never rush on-chain code. Bugs cost funds.`,
  },
  {
    id: "daily-update",
    name: "Daily Status Update",
    cron: "0 17 * * *",
    enabled: true,
    prompt: `Write your daily status update.

1. Summarize on-chain changes (instructions modified, PDAs added, circuits updated)
2. Note new on-chain capabilities that backend needs to integrate
3. Report security audit results
4. Flag any concerns about compute units or rent
5. Write to your CONTEXT.md

The dev lead and sentinel agent both monitor on-chain changes.`,
  },
];
