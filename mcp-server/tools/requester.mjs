/**
 * Requester-related MCP tools for AgentPay
 * - accept_result: Accept a submitted result and release payment
 * - dispute_task: Dispute a submitted result and get refund
 */

import { PublicKey } from "@solana/web3.js";
import {
  getProgram,
  getConnection,
  trimBytes,
  lamportsToSol,
} from "./program.mjs";

/**
 * Accept a submitted result and release payment to provider
 * @param {Object} params
 * @param {string} params.taskPda - The task PDA
 * @returns {Object} - Acceptance result
 */
export async function acceptResult({ taskPda }) {
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

  // Verify we are the requester
  if (task.requester.toBase58() !== keypair.publicKey.toBase58()) {
    return {
      success: false,
      error: "You are not the requester for this task",
      taskPda,
      requester: task.requester.toBase58(),
      yourWallet: keypair.publicKey.toBase58(),
    };
  }

  // Check task status
  const statusKey = Object.keys(task.status)[0];
  if (statusKey !== "submitted") {
    return {
      success: false,
      error: `Task is not in submitted status (current status: ${statusKey})`,
      taskPda,
    };
  }

  try {
    const tx = await program.methods
      .acceptResult()
      .accounts({
        requester: keypair.publicKey,
        taskRequest: taskPubkey,
        provider: task.provider,
        serviceListing: task.serviceListing,
      })
      .signers([keypair])
      .rpc();

    const amountSol = lamportsToSol(task.amountLamports);

    return {
      success: true,
      taskPda,
      amountReleased: amountSol,
      provider: task.provider.toBase58(),
      txSignature: tx,
      message: `Payment of ${amountSol} SOL released to provider.`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to accept result",
      details: error.message,
      taskPda,
    };
  }
}

/**
 * Dispute a submitted result and get refund
 * @param {Object} params
 * @param {string} params.taskPda - The task PDA
 * @returns {Object} - Dispute result
 */
export async function disputeTask({ taskPda }) {
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

  // Verify we are the requester
  if (task.requester.toBase58() !== keypair.publicKey.toBase58()) {
    return {
      success: false,
      error: "You are not the requester for this task",
      taskPda,
      requester: task.requester.toBase58(),
      yourWallet: keypair.publicKey.toBase58(),
    };
  }

  // Check task status
  const statusKey = Object.keys(task.status)[0];
  if (statusKey !== "submitted") {
    return {
      success: false,
      error: `Task is not in submitted status (current status: ${statusKey})`,
      taskPda,
      suggestion:
        statusKey === "open"
          ? "Task has no result yet. Wait for provider to submit or let it expire."
          : undefined,
    };
  }

  try {
    const tx = await program.methods
      .disputeTask()
      .accounts({
        requester: keypair.publicKey,
        taskRequest: taskPubkey,
      })
      .signers([keypair])
      .rpc();

    const amountSol = lamportsToSol(task.amountLamports);

    return {
      success: true,
      taskPda,
      amountRefunded: amountSol,
      txSignature: tx,
      message: `Task disputed. ${amountSol} SOL refunded to your wallet.`,
      note: "The provider will not receive payment for this task.",
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to dispute task",
      details: error.message,
      taskPda,
    };
  }
}

/**
 * Tool definitions for MCP
 */
export const requesterTools = [
  {
    name: "accept_result",
    description:
      "Accept a submitted result and release the escrowed payment to the provider. Only the task requester can call this. Use this when you're satisfied with the work.",
    inputSchema: {
      type: "object",
      properties: {
        taskPda: {
          type: "string",
          description: "The task PDA address",
        },
      },
      required: ["taskPda"],
    },
  },
  {
    name: "dispute_task",
    description:
      "Dispute a submitted result and get a refund. Only the task requester can call this. Use this when the work is unsatisfactory. The provider will not receive payment.",
    inputSchema: {
      type: "object",
      properties: {
        taskPda: {
          type: "string",
          description: "The task PDA address",
        },
      },
      required: ["taskPda"],
    },
  },
];
