pragma circom 2.1.0;

include "node_modules/circomlib/circuits/poseidon.circom";

// ZK Task Completion Proof
// Proves: Poseidon(secret_result) == expected_hash
// The provider proves they know the pre-image of the result hash
// without revealing the actual result data.

template TaskVerify() {
    // Private input: the actual result value (field element)
    signal input result;

    // Public input: the expected Poseidon hash of the result
    signal input expectedHash;

    // Compute Poseidon hash of the result
    component hasher = Poseidon(1);
    hasher.inputs[0] <== result;

    // Constrain: hash of result must equal expected hash
    hasher.out === expectedHash;
}

component main {public [expectedHash]} = TaskVerify();
