/**
 * Task-related MCP tools for AgentPay
 * - create_task: Create a new task and lock escrow
 * - get_task: Get task details
 * - list_my_tasks: List tasks for the current agent
 */

import { createHash, randomBytes } from "crypto";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import anchor from "@coral-xyz/anchor";
const { BN } = anchor;
import {
  getProgram,
  getConnection,
  PROGRAM_ID,
  TASK_REQUEST_SIZE,
  SERVICE_LISTING_SIZE,
  deriveTaskPda,
  padBytes,
  trimBytes,
  lamportsToSol,
} from "./program.mjs";

/**
 * Create a new task and lock payment in escrow
 * @param {Object} params
 * @param {string} params.servicePda - The service PDA to hire
 * @param {string} params.description - Task description (max 256 chars)
 * @param {number} [params.deadlineMinutes=60] - Deadline in minutes from now
 * @returns {Object} - Task creation result
 */
export async function createTask({ servicePda, description, deadlineMinutes = 60 }) {
  const { program, keypair, connection } = getProgram();

  // Fetch the service to get provider and price
  const servicePubkey = new PublicKey(servicePda);
  const serviceAccount = await connection.getAccountInfo(servicePubkey);

  if (!serviceAccount) {
    return {
      success: false,
      error: "Service not found",
      servicePda,
    };
  }

  const service = program.coder.accounts.decode("serviceListing", serviceAccount.data);

  if (!service.isActive) {
    return {
      success: false,
      error: "Service is not active",
      servicePda,
    };
  }

  // Generate task ID
  const taskId = randomBytes(16);

  // Calculate deadline
  const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

  // Derive task PDA
  const [taskPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("task"), keypair.publicKey.toBuffer(), taskId],
    PROGRAM_ID
  );

  try {
    const tx = await program.methods
      .createTask(
        Array.from(taskId),
        padBytes(description, 256),
        new BN(deadline)
      )
      .accounts({
        requester: keypair.publicKey,
        serviceListing: servicePubkey,
        taskRequest: taskPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();

    return {
      success: true,
      taskPda: taskPda.toBase58(),
      taskId: taskId.toString("hex"),
      provider: service.provider.toBase58(),
      servicePda,
      description,
      amountSol: lamportsToSol(service.priceLamports),
      deadline: new Date(deadline * 1000).toISOString(),
      txSignature: tx,
      message: `Task created successfully. ${lamportsToSol(service.priceLamports)} SOL locked in escrow.`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to create task",
      details: error.message,
      servicePda,
    };
  }
}

/**
 * Get details of a specific task
 * @param {Object} params
 * @param {string} params.taskPda - The task PDA address
 * @returns {Object} - Task details
 */
export async function getTask({ taskPda }) {
  const { program } = getProgram();
  const connection = getConnection();

  const pubkey = new PublicKey(taskPda);
  const accountInfo = await connection.getAccountInfo(pubkey);

  if (!accountInfo) {
    return {
      success: false,
      error: "Task not found",
      taskPda,
    };
  }

  try {
    const decoded = program.coder.accounts.decode("taskRequest", accountInfo.data);
    const statusKey = Object.keys(decoded.status)[0];
    const deadlineTs = decoded.deadline.toNumber();
    const now = Math.floor(Date.now() / 1000);

    return {
      success: true,
      task: {
        pda: taskPda,
        taskId: Buffer.from(decoded.taskId).toString("hex"),
        requester: decoded.requester.toBase58(),
        provider: decoded.provider.toBase58(),
        serviceListing: decoded.serviceListing.toBase58(),
        description: trimBytes(decoded.description),
        amountSol: lamportsToSol(decoded.amountLamports),
        amountLamports: decoded.amountLamports.toString(),
        status: statusKey,
        resultHash:
          statusKey === "submitted" || statusKey === "completed"
            ? Buffer.from(decoded.resultHash).toString("hex")
            : null,
        deadline: new Date(deadlineTs * 1000).toISOString(),
        deadlineTs,
        isExpired: now > deadlineTs && statusKey === "open",
        zkVerified: decoded.zkVerified || false,
        createdAt: new Date(decoded.createdAt.toNumber() * 1000).toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to decode task account",
      details: error.message,
      taskPda,
    };
  }
}

/**
 * List tasks for the current agent
 * @param {Object} params
 * @param {string} [params.role] - "requester" or "provider" (defaults to both)
 * @param {string} [params.status] - Filter by status: open, submitted, completed, disputed, expired
 * @returns {Object} - List of tasks
 */
export async function listMyTasks({ role, status } = {}) {
  const { program, keypair } = getProgram();
  const connection = getConnection();

  const myPubkey = keypair.publicKey.toBase58();

  // Fetch all task accounts
  const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ dataSize: TASK_REQUEST_SIZE }],
  });

  const tasks = [];

  for (const { pubkey, account } of rawAccounts) {
    try {
      const decoded = program.coder.accounts.decode("taskRequest", account.data);

      const requester = decoded.requester.toBase58();
      const provider = decoded.provider.toBase58();

      // Filter by role
      let matchesRole = false;
      if (!role) {
        matchesRole = requester === myPubkey || provider === myPubkey;
      } else if (role === "requester") {
        matchesRole = requester === myPubkey;
      } else if (role === "provider") {
        matchesRole = provider === myPubkey;
      }

      if (!matchesRole) continue;

      const statusKey = Object.keys(decoded.status)[0];

      // Filter by status
      if (status && statusKey !== status) continue;

      const deadlineTs = decoded.deadline.toNumber();
      const now = Math.floor(Date.now() / 1000);

      tasks.push({
        pda: pubkey.toBase58(),
        taskId: Buffer.from(decoded.taskId).toString("hex"),
        requester,
        provider,
        serviceListing: decoded.serviceListing.toBase58(),
        description: trimBytes(decoded.description),
        amountSol: lamportsToSol(decoded.amountLamports),
        status: statusKey,
        resultHash:
          statusKey === "submitted" || statusKey === "completed"
            ? Buffer.from(decoded.resultHash).toString("hex")
            : null,
        deadline: new Date(deadlineTs * 1000).toISOString(),
        isExpired: now > deadlineTs && statusKey === "open",
        zkVerified: decoded.zkVerified || false,
        myRole: requester === myPubkey ? "requester" : "provider",
      });
    } catch {
      // Skip incompatible accounts
    }
  }

  // Sort by deadline (most urgent first)
  tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return {
    success: true,
    count: tasks.length,
    myWallet: myPubkey,
    filters: {
      role: role || "all",
      status: status || "all",
    },
    tasks,
  };
}

/**
 * Tool definitions for MCP
 */
export const taskTools = [
  {
    name: "create_task",
    description:
      "Create a new task by hiring a service. This locks the service price in escrow. The provider must complete the task before the deadline to receive payment.",
    inputSchema: {
      type: "object",
      properties: {
        servicePda: {
          type: "string",
          description: "The service PDA to hire (from search_services)",
        },
        description: {
          type: "string",
          description: "Task description explaining what you need done (max 256 chars)",
        },
        deadlineMinutes: {
          type: "number",
          description: "Deadline in minutes from now (default: 60, max: 10080 = 7 days)",
          default: 60,
        },
      },
      required: ["servicePda", "description"],
    },
  },
  {
    name: "get_task",
    description:
      "Get detailed information about a specific task by its PDA. Returns task status, description, payment amount, deadline, and result hash if submitted.",
    inputSchema: {
      type: "object",
      properties: {
        taskPda: {
          type: "string",
          description: "The task PDA address (base58 encoded)",
        },
      },
      required: ["taskPda"],
    },
  },
  {
    name: "list_my_tasks",
    description:
      "List tasks where you are either the requester (hired someone) or the provider (got hired). Useful for checking pending work or task status.",
    inputSchema: {
      type: "object",
      properties: {
        role: {
          type: "string",
          enum: ["requester", "provider"],
          description: "Filter by your role: requester (you hired), provider (you got hired)",
        },
        status: {
          type: "string",
          enum: ["open", "submitted", "completed", "disputed", "expired"],
          description: "Filter by task status",
        },
      },
    },
  },
];
