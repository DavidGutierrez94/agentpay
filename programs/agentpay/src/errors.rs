use anchor_lang::prelude::*;

#[error_code]
pub enum AgentPayError {
    #[msg("Service is not active")]
    ServiceNotActive,
    #[msg("Payment amount is below the service price")]
    InsufficientPayment,
    #[msg("Task is not in the expected status")]
    InvalidTaskStatus,
    #[msg("Only the task requester can perform this action")]
    UnauthorizedRequester,
    #[msg("Only the task provider can perform this action")]
    UnauthorizedProvider,
    #[msg("Only the service provider can perform this action")]
    UnauthorizedServiceOwner,
    #[msg("Task deadline has not passed yet")]
    DeadlineNotReached,
    #[msg("Task deadline has passed")]
    DeadlinePassed,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("ZK proof verification failed")]
    ZkProofVerificationFailed,
    #[msg("Provider reputation is too low for this service")]
    ReputationTooLow,
}
