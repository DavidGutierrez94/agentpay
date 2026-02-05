use anchor_lang::prelude::*;

#[account]
pub struct ServiceListing {
    /// The agent's wallet that provides this service
    pub provider: Pubkey,
    /// Unique service identifier (client-generated)
    pub service_id: [u8; 16],
    /// Human-readable description of the service
    pub description: [u8; 128],
    /// Cost per task in lamports
    pub price_lamports: u64,
    /// Whether this service is currently accepting work
    pub is_active: bool,
    /// Number of tasks successfully completed (reputation)
    pub tasks_completed: u64,
    /// Timestamp of creation
    pub created_at: i64,
    /// Minimum reputation score required (0 = no minimum)
    pub min_reputation: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl ServiceListing {
    pub const SIZE: usize = 8  // discriminator
        + 32   // provider
        + 16   // service_id
        + 128  // description
        + 8    // price_lamports
        + 1    // is_active
        + 8    // tasks_completed
        + 8    // created_at
        + 8    // min_reputation
        + 1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum TaskStatus {
    /// Task created, escrow locked, waiting for provider to do work
    Open = 0,
    /// Provider submitted result, waiting for requester to accept
    Submitted = 1,
    /// Requester accepted, escrow released to provider
    Completed = 2,
    /// Requester disputed, escrow returned to requester
    Disputed = 3,
    /// Deadline passed with no result, escrow returned to requester
    Expired = 4,
}

#[account]
pub struct TaskRequest {
    /// The agent requesting work (buyer)
    pub requester: Pubkey,
    /// The agent doing the work (seller)
    pub provider: Pubkey,
    /// Reference to the service listing
    pub service_listing: Pubkey,
    /// Unique task identifier (client-generated)
    pub task_id: [u8; 16],
    /// Description of what needs to be done
    pub description: [u8; 256],
    /// Payment amount locked in escrow (lamports)
    pub amount_lamports: u64,
    /// Current status of the task
    pub status: TaskStatus,
    /// SHA256 hash of the delivered result (set by provider)
    pub result_hash: [u8; 32],
    /// Unix timestamp deadline for task completion
    pub deadline: i64,
    /// Timestamp of creation
    pub created_at: i64,
    /// Whether the result was ZK-verified (Groth16 proof verified on-chain)
    pub zk_verified: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl TaskRequest {
    pub const SIZE: usize = 8  // discriminator
        + 32   // requester
        + 32   // provider
        + 32   // service_listing
        + 16   // task_id
        + 256  // description
        + 8    // amount_lamports
        + 1    // status
        + 32   // result_hash
        + 8    // deadline
        + 8    // created_at
        + 1    // zk_verified
        + 1;   // bump
}
