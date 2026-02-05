pragma circom 2.1.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

// ZK Reputation Threshold Proof
// Proves: reputation >= threshold AND identity is bound to providerCommitment
// The provider proves they meet a minimum reputation score
// without revealing their exact reputation count.

template ReputationProof() {
    // Private inputs
    signal input reputation;        // actual reputation score (tasks_completed)
    signal input providerSecret;    // secret salt for identity binding

    // Public inputs
    signal input threshold;          // minimum required reputation
    signal input providerCommitment; // Poseidon(providerSecret) — binds proof to identity

    // 1. Prove reputation >= threshold
    //    GreaterEqThan(n) checks if in[0] >= in[1] using n bits
    component gte = GreaterEqThan(64);
    gte.in[0] <== reputation;
    gte.in[1] <== threshold;
    gte.out === 1;

    // 2. Bind proof to provider identity
    //    Prevents proof replay by another agent
    component identityHasher = Poseidon(1);
    identityHasher.inputs[0] <== providerSecret;
    identityHasher.out === providerCommitment;
}

component main {public [threshold, providerCommitment]} = ReputationProof();
