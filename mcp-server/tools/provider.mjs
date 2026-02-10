/**
 * Provider-related MCP tools for AgentPay
 * - submit_result: Submit work result for a task
 * - submit_result_zk: Submit result with ZK proof verification
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "./program.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ZK circuit paths
const CIRCUITS_DIR = join(__dirname, "../../circuits");
const WASM_PATH = join(CIRCUITS_DIR, "task_verify/task_verify_js/task_verify.wasm");
const ZKEY_PATH = join(CIRCUITS_DIR, "task_verify/task_verify_0001.zkey");

/**
 * Convert BigInt to 32-byte big-endian buffer
 */
function bigIntToBytes32BE(n) {
  const hex = n.toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}

/**
 * Convert snarkjs proof format to groth16-solana byte format
 */
function formatProofForSolana(proof) {
  // proof_a: negate y coordinate and convert to big-endian
  const a = Buffer.alloc(64);
  const pi_a_x = BigInt(proof.pi_a[0]);
  const pi_a_y = BigInt(proof.pi_a[1]);
  const P = BigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
  const neg_y = (P - pi_a_y) % P;
  bigIntToBytes32BE(pi_a_x).copy(a, 0);
  bigIntToBytes32BE(neg_y).copy(a, 32);

  // proof_b: G2 point reordering
  const b = Buffer.alloc(128);
  bigIntToBytes32BE(BigInt(proof.pi_b[0][1])).copy(b, 0);
  bigIntToBytes32BE(BigInt(proof.pi_b[0][0])).copy(b, 32);
  bigIntToBytes32BE(BigInt(proof.pi_b[1][1])).copy(b, 64);
  bigIntToBytes32BE(BigInt(proof.pi_b[1][0])).copy(b, 96);

  // proof_c: direct conversion
  const c = Buffer.alloc(64);
  bigIntToBytes32BE(BigInt(proof.pi_c[0])).copy(c, 0);
  bigIntToBytes32BE(BigInt(proof.pi_c[1])).copy(c, 32);

  return { a, b, c };
}

/**
 * Submit a result for a task (without ZK proof)
 * @param {Object} params
 * @param {string} params.taskPda - The task PDA
 * @param {string} params.result - The result text
 * @returns {Object} - Submission result
 */
export async function submitResult({ taskPda, result }) {
  const { program, keypair, connection } = getProgram();

  const taskPubkey = new PublicKey(taskPda);
  const taskAccount = await connection.getAccountInfo(taskPubkey);

  if (!taskAccount) {
    return {
      success: false,
      error: "Task not found",
      taskPda,
    };
  }

  const task = program.coder.accounts.decode("taskRequest", taskAccount.data);

  // Verify we are the provider
  if (task.provider.toBase58() !== keypair.publicKey.toBase58()) {
    return {
      success: false,
      error: "You are not the provider for this task",
      taskPda,
      provider: task.provider.toBase58(),
      yourWallet: keypair.publicKey.toBase58(),
    };
  }

  // Check task status
  const statusKey = Object.keys(task.status)[0];
  if (statusKey !== "open") {
    return {
      success: false,
      error: `Task is not open (current status: ${statusKey})`,
      taskPda,
    };
  }

  // Check deadline
  const now = Math.floor(Date.now() / 1000);
  const deadline = task.deadline.toNumber();
  if (now > deadline) {
    return {
      success: false,
      error: "Task deadline has passed",
      taskPda,
      deadline: new Date(deadline * 1000).toISOString(),
    };
  }

  // Hash the result
  const resultHash = createHash("sha256").update(result).digest();

  try {
    const tx = await program.methods
      .submitResult(Array.from(resultHash))
      .accounts({
        provider: keypair.publicKey,
        taskRequest: taskPubkey,
      })
      .signers([keypair])
      .rpc();

    return {
      success: true,
      taskPda,
      resultHash: resultHash.toString("hex"),
      zkVerified: false,
      txSignature: tx,
      message: "Result submitted successfully. Waiting for requester to accept.",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to submit result",
      details: error.message,
      taskPda,
    };
  }
}

/**
 * Submit a result with ZK proof verification
 * @param {Object} params
 * @param {string} params.taskPda - The task PDA
 * @param {string} params.result - The result text
 * @returns {Object} - Submission result
 */
export async function submitResultZk({ taskPda, result }) {
  const { program, keypair, connection } = getProgram();

  // Check if ZK circuit files exist
  if (!existsSync(WASM_PATH) || !existsSync(ZKEY_PATH)) {
    // Fall back to regular submission with warning
    console.warn("ZK circuit files not found, using regular submission");
    const regularResult = await submitResult({ taskPda, result });
    regularResult.warning = "ZK circuit files not found. Used regular submission instead.";
    return regularResult;
  }

  const taskPubkey = new PublicKey(taskPda);
  const taskAccount = await connection.getAccountInfo(taskPubkey);

  if (!taskAccount) {
    return {
      success: false,
      error: "Task not found",
      taskPda,
    };
  }

  const task = program.coder.accounts.decode("taskRequest", taskAccount.data);

  // Verify we are the provider
  if (task.provider.toBase58() !== keypair.publicKey.toBase58()) {
    return {
      success: false,
      error: "You are not the provider for this task",
      taskPda,
    };
  }

  // Check task status
  const statusKey = Object.keys(task.status)[0];
  if (statusKey !== "open") {
    return {
      success: false,
      error: `Task is not open (current status: ${statusKey})`,
      taskPda,
    };
  }

  // Check deadline
  const now = Math.floor(Date.now() / 1000);
  const deadline = task.deadline.toNumber();
  if (now > deadline) {
    return {
      success: false,
      error: "Task deadline has passed",
      taskPda,
    };
  }

  try {
    // Dynamic import for snarkjs (it's a CommonJS module)
    const snarkjs = await import("snarkjs");

    // Compute Poseidon hash of result for the circuit
    // For simplicity, we use the first 31 bytes of SHA256 as the preimage
    const sha256Hash = createHash("sha256").update(result).digest();
    const preimage = BigInt(`0x${sha256Hash.subarray(0, 31).toString("hex")}`);

    // Generate ZK proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { preimage },
      WASM_PATH,
      ZKEY_PATH,
    );

    // Format proof for Solana
    const { a, b, c } = formatProofForSolana(proof);

    // The public signal is the Poseidon hash (result hash for on-chain)
    const resultHash = Buffer.alloc(32);
    const hashBigInt = BigInt(publicSignals[0]);
    bigIntToBytes32BE(hashBigInt).copy(resultHash);

    const tx = await program.methods
      .submitResultZk(Array.from(a), Array.from(b), Array.from(c), Array.from(resultHash))
      .accounts({
        provider: keypair.publicKey,
        taskRequest: taskPubkey,
      })
      .signers([keypair])
      .rpc();

    return {
      success: true,
      taskPda,
      resultHash: resultHash.toString("hex"),
      zkVerified: true,
      txSignature: tx,
      message: "ZK-verified result submitted successfully. Waiting for requester to accept.",
    };
  } catch (error) {
    // If ZK proof generation fails, offer to fall back
    return {
      success: false,
      error: "Failed to generate ZK proof",
      details: error.message,
      taskPda,
      suggestion: "Try using submit_result without ZK verification",
    };
  }
}

/**
 * Tool definitions for MCP
 */
export const providerTools = [
  {
    name: "submit_result",
    description:
      "Submit the result of a completed task. The result text is hashed and stored on-chain. The requester will review and either accept (releasing payment) or dispute.",
    inputSchema: {
      type: "object",
      properties: {
        taskPda: {
          type: "string",
          description: "The task PDA address",
        },
        result: {
          type: "string",
          description: "The result text or data (will be hashed on-chain)",
        },
      },
      required: ["taskPda", "result"],
    },
  },
  {
    name: "submit_result_zk",
    description:
      "Submit the result with a zero-knowledge proof. This proves you know the result without revealing it, providing cryptographic verification. Preferred over regular submission when possible.",
    inputSchema: {
      type: "object",
      properties: {
        taskPda: {
          type: "string",
          description: "The task PDA address",
        },
        result: {
          type: "string",
          description: "The result text or data (will be ZK-verified on-chain)",
        },
      },
      required: ["taskPda", "result"],
    },
  },
];
