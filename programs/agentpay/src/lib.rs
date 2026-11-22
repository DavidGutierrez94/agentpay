use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub mod errors;
pub mod state;
pub mod zk;

use errors::AgentPayError;
use state::*;

declare_id!("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");

#[program]
pub mod agentpay {
    use super::*;

    /// Register a new service listing on-chain.
    /// The provider advertises what they offer and at what price.
    pub fn register_service(
        ctx: Context<RegisterService>,
        service_id: [u8; 16],
        description: [u8; 128],
        price_lamports: u64,
        min_reputation: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.service_listing;
        listing.provider = ctx.accounts.provider.key();
        listing.service_id = service_id;
        listing.description = description;
        listing.price_lamports = price_lamports;
        listing.is_active = true;
        listing.tasks_completed = 0;
        listing.created_at = Clock::get()?.unix_timestamp;
        listing.min_reputation = min_reputation;
        listing.bump = ctx.bumps.service_listing;
        Ok(())
    }

    /// Deactivate a service listing. Only the provider can do this.
    pub fn deactivate_service(ctx: Context<DeactivateService>) -> Result<()> {
        let listing = &mut ctx.accounts.service_listing;
        require!(
            listing.provider == ctx.accounts.provider.key(),
            AgentPayError::UnauthorizedServiceOwner
        );
        listing.is_active = false;
        Ok(())
    }

    /// Create a task request and lock payment in escrow.
    /// The requester (buyer) specifies the provider, description, payment, and deadline.
    pub fn create_task(
        ctx: Context<CreateTask>,
        task_id: [u8; 16],
        description: [u8; 256],
        deadline: i64,
    ) -> Result<()> {
        let listing = &ctx.accounts.service_listing;
        let now = Clock::get()?.unix_timestamp;

        require!(listing.is_active, AgentPayError::ServiceNotActive);
        require!(deadline > now, AgentPayError::DeadlineInPast);

        let amount = listing.price_lamports;

        // Transfer SOL from requester to task_request PDA (acts as escrow)
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.requester.to_account_info(),
                    to: ctx.accounts.task_request.to_account_info(),
                },
            ),
            amount,
        )?;

        let task = &mut ctx.accounts.task_request;
        task.requester = ctx.accounts.requester.key();
        task.provider = listing.provider;
        task.service_listing = ctx.accounts.service_listing.key();
        task.task_id = task_id;
        task.description = description;
        task.amount_lamports = amount;
        task.status = TaskStatus::Open;
        task.result_hash = [0u8; 32];
        task.deadline = deadline;
        task.created_at = now;
        task.zk_verified = false;
        task.bump = ctx.bumps.task_request;

        msg!(
            "Task created: requester={}, provider={}, amount={}",
            task.requester,
            task.provider,
            task.amount_lamports
        );

        Ok(())
    }

    /// Provider submits a result hash for a task.
    /// The actual result data is exchanged off-chain; the hash provides verifiability.
    pub fn submit_result(
        ctx: Context<SubmitResult>,
        result_hash: [u8; 32],
    ) -> Result<()> {
        let task = &mut ctx.accounts.task_request;
        let now = Clock::get()?.unix_timestamp;

        require!(
            task.provider == ctx.accounts.provider.key(),
            AgentPayError::UnauthorizedProvider
        );
        require!(
            task.status == TaskStatus::Open,
            AgentPayError::InvalidTaskStatus
        );
        require!(now <= task.deadline, AgentPayError::DeadlinePassed);

        task.result_hash = result_hash;
        task.status = TaskStatus::Submitted;

        msg!("Result submitted for task by provider {}", task.provider);

        Ok(())
    }

    /// Requester accepts the submitted result.
    /// Escrow funds are released to the provider.
    pub fn accept_result(ctx: Context<AcceptResult>) -> Result<()> {
        let task = &mut ctx.accounts.task_request;

        require!(
            task.requester == ctx.accounts.requester.key(),
            AgentPayError::UnauthorizedRequester
        );
        require!(
            task.status == TaskStatus::Submitted,
            AgentPayError::InvalidTaskStatus
        );

        let amount = task.amount_lamports;
        task.status = TaskStatus::Completed;

        // Transfer lamports from task PDA to provider
        let task_account_info = task.to_account_info();
        let provider_account_info = ctx.accounts.provider.to_account_info();

        **task_account_info.try_borrow_mut_lamports()? -= amount;
        **provider_account_info.try_borrow_mut_lamports()? += amount;

        // Increment the provider's completed task counter
        let listing = &mut ctx.accounts.service_listing;
        listing.tasks_completed = listing.tasks_completed.checked_add(1).unwrap();

        msg!(
            "Task completed: {} lamports released to provider {}",
            amount,
            task.provider
        );

        Ok(())
    }

    /// Requester disputes a submitted result.
    ///
    /// The escrow is split instead of fully refunded, so a requester cannot
    /// receive the work off-chain and then reclaim the whole payment
    /// (docs/DISPUTE-RESOLUTION-V2.md, Phase 2): the provider keeps 50% when the
    /// result was ZK-verified and 20% otherwise; the requester gets the rest.
    pub fn dispute_task(ctx: Context<DisputeTask>) -> Result<()> {
        let task = &mut ctx.accounts.task_request;

        require!(
            task.requester == ctx.accounts.requester.key(),
            AgentPayError::UnauthorizedRequester
        );
        require!(
            task.status == TaskStatus::Submitted,
            AgentPayError::InvalidTaskStatus
        );

        let amount = task.amount_lamports;
        let provider_share = dispute_provider_share(amount, task.zk_verified);
        let requester_share = amount - provider_share;
        task.status = TaskStatus::Disputed;

        let task_account_info = task.to_account_info();
        let requester_account_info = ctx.accounts.requester.to_account_info();
        let provider_account_info = ctx.accounts.provider.to_account_info();

        **task_account_info.try_borrow_mut_lamports()? -= amount;
        **provider_account_info.try_borrow_mut_lamports()? += provider_share;
        **requester_account_info.try_borrow_mut_lamports()? += requester_share;

        msg!(
            "Task disputed: {} lamports refunded to requester {}, {} lamports to provider {} (zk_verified: {})",
            requester_share,
            task.requester,
            provider_share,
            task.provider,
            task.zk_verified
        );

        Ok(())
    }

    /// Expire a task that has passed its deadline without a result submission.
    /// Anyone can call this (permissionless crank). Funds return to the requester.
    pub fn expire_task(ctx: Context<ExpireTask>) -> Result<()> {
        let task = &mut ctx.accounts.task_request;
        let now = Clock::get()?.unix_timestamp;

        require!(
            task.status == TaskStatus::Open,
            AgentPayError::InvalidTaskStatus
        );
        require!(now > task.deadline, AgentPayError::DeadlineNotReached);

        let amount = task.amount_lamports;
        task.status = TaskStatus::Expired;

        // Refund lamports from task PDA back to requester
        let task_account_info = task.to_account_info();
        let requester_account_info = ctx.accounts.requester.to_account_info();

        **task_account_info.try_borrow_mut_lamports()? -= amount;
        **requester_account_info.try_borrow_mut_lamports()? += amount;

        msg!(
            "Task expired: {} lamports refunded to requester {}",
            amount,
            task.requester
        );

        Ok(())
    }

    /// Submit a result with ZK proof verification.
    /// The provider proves knowledge of the result pre-image via a Groth16 proof.
    /// proof_a: 64 bytes (G1, negated, big-endian)
    /// proof_b: 128 bytes (G2, big-endian)
    /// proof_c: 64 bytes (G1, big-endian)
    /// result_hash: 32 bytes (the Poseidon hash, used as public input)
    pub fn submit_result_zk(
        ctx: Context<SubmitResult>,
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        result_hash: [u8; 32],
    ) -> Result<()> {
        let task = &mut ctx.accounts.task_request;
        let now = Clock::get()?.unix_timestamp;

        require!(
            task.provider == ctx.accounts.provider.key(),
            AgentPayError::UnauthorizedProvider
        );
        require!(
            task.status == TaskStatus::Open,
            AgentPayError::InvalidTaskStatus
        );
        require!(now <= task.deadline, AgentPayError::DeadlinePassed);

        // Verify the Groth16 proof on-chain
        // Public input: the Poseidon hash of the result
        zk::verify_task_proof(&proof_a, &proof_b, &proof_c, &[result_hash])?;

        task.result_hash = result_hash;
        task.status = TaskStatus::Submitted;
        task.zk_verified = true;

        msg!(
            "ZK-verified result submitted for task by provider {}",
            task.provider
        );

        Ok(())
    }

    /// Verify a provider's reputation meets the service minimum requirement.
    /// Uses a ZK proof to prove reputation >= threshold without revealing exact score.
    /// This is called by the requester before creating a task, to verify the provider qualifies.
    pub fn verify_reputation(
        ctx: Context<VerifyReputation>,
        proof_a: [u8; 64],
        proof_b: [u8; 128],
        proof_c: [u8; 64],
        threshold: [u8; 32],
        provider_commitment: [u8; 32],
    ) -> Result<()> {
        let listing = &ctx.accounts.service_listing;

        require!(listing.is_active, AgentPayError::ServiceNotActive);

        // Verify the Groth16 reputation proof
        // Public inputs: [threshold, providerCommitment]
        zk::verify_reputation_proof(&proof_a, &proof_b, &proof_c, &[threshold, provider_commitment])?;

        msg!(
            "Reputation verified for service {} (threshold met)",
            ctx.accounts.service_listing.key()
        );

        Ok(())
    }
}

// ============================================================================
// Account validation structs
// ============================================================================

#[derive(Accounts)]
#[instruction(service_id: [u8; 16])]
pub struct RegisterService<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,

    #[account(
        init,
        payer = provider,
        space = ServiceListing::SIZE,
        seeds = [b"service", provider.key().as_ref(), service_id.as_ref()],
        bump,
    )]
    pub service_listing: Account<'info, ServiceListing>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeactivateService<'info> {
    pub provider: Signer<'info>,

    #[account(
        mut,
        seeds = [b"service", provider.key().as_ref(), service_listing.service_id.as_ref()],
        bump = service_listing.bump,
        has_one = provider @ AgentPayError::UnauthorizedServiceOwner,
    )]
    pub service_listing: Account<'info, ServiceListing>,
}

#[derive(Accounts)]
#[instruction(task_id: [u8; 16])]
pub struct CreateTask<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        seeds = [b"service", service_listing.provider.as_ref(), service_listing.service_id.as_ref()],
        bump = service_listing.bump,
    )]
    pub service_listing: Account<'info, ServiceListing>,

    #[account(
        init,
        payer = requester,
        space = TaskRequest::SIZE,
        seeds = [b"task", requester.key().as_ref(), task_id.as_ref()],
        bump,
    )]
    pub task_request: Account<'info, TaskRequest>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    pub provider: Signer<'info>,

    #[account(
        mut,
        seeds = [b"task", task_request.requester.as_ref(), task_request.task_id.as_ref()],
        bump = task_request.bump,
        has_one = provider @ AgentPayError::UnauthorizedProvider,
    )]
    pub task_request: Account<'info, TaskRequest>,
}

#[derive(Accounts)]
pub struct AcceptResult<'info> {
    pub requester: Signer<'info>,

    #[account(
        mut,
        seeds = [b"task", requester.key().as_ref(), task_request.task_id.as_ref()],
        bump = task_request.bump,
        has_one = requester @ AgentPayError::UnauthorizedRequester,
    )]
    pub task_request: Account<'info, TaskRequest>,

    /// CHECK: The provider wallet to receive payment. Validated via task_request.provider.
    #[account(
        mut,
        constraint = provider.key() == task_request.provider,
    )]
    pub provider: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"service", task_request.provider.as_ref(), service_listing.service_id.as_ref()],
        bump = service_listing.bump,
    )]
    pub service_listing: Account<'info, ServiceListing>,
}

#[derive(Accounts)]
pub struct DisputeTask<'info> {
    #[account(mut)]
    pub requester: Signer<'info>,

    #[account(
        mut,
        seeds = [b"task", requester.key().as_ref(), task_request.task_id.as_ref()],
        bump = task_request.bump,
        has_one = requester @ AgentPayError::UnauthorizedRequester,
        has_one = provider @ AgentPayError::UnauthorizedProvider,
    )]
    pub task_request: Account<'info, TaskRequest>,

    /// CHECK: The provider wallet receiving its share. Validated via task_request.provider.
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct ExpireTask<'info> {
    /// CHECK: The requester to receive the refund. Validated via task_request.requester.
    #[account(
        mut,
        constraint = requester.key() == task_request.requester,
    )]
    pub requester: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"task", task_request.requester.as_ref(), task_request.task_id.as_ref()],
        bump = task_request.bump,
    )]
    pub task_request: Account<'info, TaskRequest>,
}

#[derive(Accounts)]
pub struct VerifyReputation<'info> {
    pub signer: Signer<'info>,

    #[account(
        seeds = [b"service", service_listing.provider.as_ref(), service_listing.service_id.as_ref()],
        bump = service_listing.bump,
    )]
    pub service_listing: Account<'info, ServiceListing>,
}

/// Provider's share of the escrow when a submitted result is disputed:
/// 50% for a ZK-verified result, 20% otherwise.
pub fn dispute_provider_share(amount: u64, zk_verified: bool) -> u64 {
    if zk_verified {
        amount / 2
    } else {
        amount / 5
    }
}

#[cfg(test)]
mod tests {
    use super::dispute_provider_share;

    #[test]
    fn dispute_split_shares() {
        assert_eq!(dispute_provider_share(1_000_000, false), 200_000);
        assert_eq!(dispute_provider_share(1_000_000, true), 500_000);
        // rounding favours the requester and never exceeds the escrow
        assert_eq!(dispute_provider_share(7, false), 1);
        assert_eq!(dispute_provider_share(7, true), 3);
        assert_eq!(dispute_provider_share(0, true), 0);
        assert_eq!(dispute_provider_share(u64::MAX, true), u64::MAX / 2);
    }
}
