# Dispute Resolution v2 — Design Proposal

## Problem Statement

The current dispute model has a critical vulnerability:

```
CURRENT FLOW:
1. Requester creates task (locks escrow)
2. Provider submits result
3. Requester disputes → Gets immediate refund
4. Provider loses work + payment
```

**Exploitation vector:** A malicious requester can:
1. Hire a provider for work
2. Receive the completed result (off-chain)
3. Dispute and get a full refund
4. Keep the work for free

This creates a **requester-favored** asymmetry that discourages providers from participating.

## Proposed Solutions

### Solution 1: Dispute Cooling Period (Low Risk)

Add a 24-48 hour delay before dispute refunds are processed, during which:
- Provider can submit evidence (execution traces, Memo anchors)
- Community can flag suspicious patterns
- Automated checks run (same requester disputing repeatedly?)

**Implementation:**
```rust
// In DisputeTask
task.status = TaskStatus::DisputePending;
task.dispute_initiated_at = Clock::get()?.unix_timestamp;

// New instruction: FinalizeDispute (after cooling period)
pub fn finalize_dispute(ctx: Context<FinalizeDispute>) -> Result<()> {
    let task = &mut ctx.accounts.task_request;
    let now = Clock::get()?.unix_timestamp;

    require!(
        now > task.dispute_initiated_at + COOLING_PERIOD,
        AgentPayError::CoolingPeriodActive
    );

    // If no arbiter intervention, refund proceeds
    if task.arbiter_ruling.is_none() {
        // Refund to requester (current behavior)
    }
    Ok(())
}
```

**Pros:** Minimal program change, compatible with existing PDAs
**Cons:** Doesn't fully solve the problem, just delays it

---

### Solution 2: Partial Refund Split (Medium Risk)

Instead of 100% refund to requester, split the escrow:
- Provider gets X% (e.g., 20-50%) for work performed
- Requester gets remainder
- Percentage can be based on ZK verification status

**Implementation:**
```rust
pub fn dispute_task(ctx: Context<DisputeTask>) -> Result<()> {
    let task = &mut ctx.accounts.task_request;
    let amount = task.amount_lamports;

    // If provider submitted ZK-verified result, they get 50%
    // Otherwise they get 20%
    let provider_share = if task.zk_verified {
        amount / 2
    } else {
        amount / 5
    };
    let requester_share = amount - provider_share;

    // Transfer to provider
    **task_account_info.try_borrow_mut_lamports()? -= provider_share;
    **provider_account_info.try_borrow_mut_lamports()? += provider_share;

    // Transfer to requester
    **task_account_info.try_borrow_mut_lamports()? -= requester_share;
    **requester_account_info.try_borrow_mut_lamports()? += requester_share;

    task.status = TaskStatus::Disputed;
    Ok(())
}
```

**Pros:** Simple, no new accounts, deters frivolous disputes
**Cons:** Doesn't distinguish legitimate vs malicious disputes

---

### Solution 3: Staked Arbiter Pool (High Complexity)

Create an on-chain arbitration system:

1. **Arbiter Registration**
   - Arbiters stake SOL to participate
   - Earns fees from resolved disputes
   - Stake slashed for bad-faith rulings

2. **Dispute Flow**
   ```
   Dispute Initiated → 3 Random Arbiters Assigned →
   Evidence Submission Period (24h) →
   Arbiter Voting (48h) →
   Majority Rules → Funds Distributed
   ```

3. **Evidence Types**
   - Result hash verification (prove result matches task)
   - Execution trace Memo hashes (via SlotScribe integration)
   - On-chain activity correlation
   - ZK proof status

**New Accounts:**
```rust
#[account]
pub struct ArbiterRegistry {
    pub arbiter: Pubkey,
    pub stake: u64,
    pub disputes_resolved: u64,
    pub reputation_score: u64,
    pub slashed_count: u64,
    pub registered_at: i64,
    pub bump: u8,
}

#[account]
pub struct DisputeCase {
    pub task_request: Pubkey,
    pub requester: Pubkey,
    pub provider: Pubkey,
    pub arbiters: [Pubkey; 3],
    pub votes: [Option<bool>; 3], // true = provider wins
    pub evidence_deadline: i64,
    pub voting_deadline: i64,
    pub status: DisputeStatus,
    pub requester_evidence_hash: [u8; 32],
    pub provider_evidence_hash: [u8; 32],
    pub bump: u8,
}
```

**Pros:** Fair, decentralized, creates economic incentives
**Cons:** High complexity, needs bootstrap (who are initial arbiters?)

---

### Solution 4: Reputation-Based Auto-Resolution (Hybrid)

Use on-chain reputation to auto-resolve disputes:

1. **Track dispute stats per wallet:**
   ```rust
   #[account]
   pub struct AgentReputation {
       pub wallet: Pubkey,
       pub tasks_completed: u64,
       pub tasks_disputed_as_requester: u64,
       pub tasks_disputed_as_provider: u64,
       pub zk_verified_count: u64,
       pub reputation_score: u64, // Computed score
       pub bump: u8,
   }
   ```

2. **Dispute resolution logic:**
   ```
   IF requester.dispute_rate > 30% AND provider.dispute_rate < 10%:
       → Provider wins (requester likely malicious)
   ELSE IF provider.zk_verified AND requester.reputation_score < provider.reputation_score:
       → Split 70/30 in favor of provider
   ELSE:
       → Default to arbiter pool OR 50/50 split
   ```

3. **Reputation decay:**
   - Dispute as requester: -10 points
   - Dispute as provider: -5 points
   - Completed task: +5 points
   - ZK-verified completion: +10 points

**Pros:** Algorithmic, punishes repeat offenders
**Cons:** New account per wallet, cold start problem

---

## Recommended Approach for v1.1

Given the hackathon deadline, I recommend a **phased approach**:

### Phase 1: UI-Only Changes (No Program Change)

1. **Track dispute rates on Agent Registry:**
   - Show "Dispute Rate as Requester: X%"
   - Warning badge for high-dispute wallets
   - Let providers check requester history before accepting

2. **Add dispute confirmation dialog:**
   - "This provider submitted a ZK-verified result. Are you sure you want to dispute?"
   - Show provider's completion history

3. **Add provider warnings:**
   - Before accepting a task, show requester's dispute history
   - "Warning: This requester has disputed 40% of tasks"

### Phase 2: Partial Refund Split (v1.1)

- Implement Solution 2 (50/50 split for ZK-verified)
- Low risk, simple program change
- Immediately deters exploitation

### Phase 3: Reputation System (v2.0)

- Implement Solution 4
- Requires new AgentReputation account
- Full backward compatibility

---

## Implementation Status

### Phase 1 (This PR)

- [ ] Add `disputeRateAsRequester` to Agent profile
- [ ] Add `disputeRateAsProvider` to Agent profile
- [ ] Show warning badges on Agent Registry
- [ ] Add dispute confirmation dialog with provider stats
- [ ] Show requester history to providers

### Phase 2 (Future PR)

- [ ] Modify `dispute_task` for split refund
- [ ] Add provider account to DisputeTask context
- [ ] Tests for new dispute logic

### Phase 3 (v2.0)

- [ ] Design AgentReputation account
- [ ] Implement reputation scoring
- [ ] Auto-resolution based on scores
- [ ] Decay mechanism

---

## Risk Assessment

| Solution | Complexity | Program Change | Breaking Change | Time to Implement |
|----------|------------|----------------|-----------------|-------------------|
| Cooling Period | Low | Yes (new instruction) | No | 2-3 hours |
| Partial Split | Low | Yes (modify existing) | No | 1-2 hours |
| Arbiter Pool | High | Yes (many new) | No | 2-3 days |
| Reputation | Medium | Yes (new account) | No | 4-6 hours |
| UI-Only | None | No | No | 2-3 hours |

**Recommendation:** Start with UI-Only (Phase 1) for immediate mitigation, then implement Partial Split (Phase 2) as a quick win before the hackathon deadline.

---

## References

- [SlotScribe Integration Comment](https://colosseum.com/agent-hackathon/forum/2450) — Execution trace anchoring
- [Sentience DeFi Integration](https://colosseum.com/agent-hackathon/forum/2363) — Potential arbiter pool collaboration
- [AgentPay Security Model](./SECURITY.md) — Existing threat model
