/**
 * GET /api/v1/tasks
 * List all tasks on the AgentPay protocol
 */

import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const TASK_REQUEST_SIZE = 435;

// Task status enum mapping
const STATUS_MAP: Record<number, string> = {
  0: "open",
  1: "submitted",
  2: "completed",
  3: "disputed",
  4: "expired",
};

function trimBytes(arr: number[]): string {
  const buf = Buffer.from(arr);
  const end = buf.indexOf(0);
  return buf.subarray(0, end === -1 ? buf.length : end).toString("utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requester = searchParams.get("requester");
  const provider = searchParams.get("provider");
  const status = searchParams.get("status");

  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // Build filters
    const filters: Array<{ dataSize: number } | { memcmp: { offset: number; bytes: string } }> = [
      { dataSize: TASK_REQUEST_SIZE },
    ];

    if (requester) {
      filters.push({
        memcmp: {
          offset: 8, // after discriminator
          bytes: requester,
        },
      });
    }

    if (provider) {
      filters.push({
        memcmp: {
          offset: 40, // after discriminator + requester
          bytes: provider,
        },
      });
    }

    const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });

    const tasks = [];
    const now = Math.floor(Date.now() / 1000);

    for (const { pubkey, account } of rawAccounts) {
      try {
        const data = account.data;

        // Parse TaskRequest layout:
        // 8 bytes discriminator
        // 32 bytes requester
        // 32 bytes provider
        // 32 bytes serviceListing
        // 16 bytes taskId
        // 256 bytes description
        // 8 bytes amountLamports
        // 1 byte status (enum)
        // 32 bytes resultHash
        // 8 bytes deadline
        // 8 bytes createdAt
        // 1 byte zkVerified
        // 1 byte bump

        const requesterPubkey = new PublicKey(data.subarray(8, 40));
        const providerPubkey = new PublicKey(data.subarray(40, 72));
        const serviceListingPubkey = new PublicKey(data.subarray(72, 104));
        const taskId = data.subarray(104, 120);
        const description = Array.from(data.subarray(120, 376));
        const amountLamports = data.readBigUInt64LE(376);
        const statusByte = data[384];
        const resultHash = data.subarray(385, 417);
        const deadline = Number(data.readBigInt64LE(417));
        const createdAt = Number(data.readBigInt64LE(425));
        const zkVerified = data[433] === 1;

        const statusKey = STATUS_MAP[statusByte] || "unknown";

        // Apply status filter
        if (status && statusKey !== status) continue;

        tasks.push({
          pda: pubkey.toBase58(),
          taskId: Buffer.from(taskId).toString("hex"),
          requester: requesterPubkey.toBase58(),
          provider: providerPubkey.toBase58(),
          serviceListing: serviceListingPubkey.toBase58(),
          description: trimBytes(description),
          amountSol: (Number(amountLamports) / 1e9).toFixed(4),
          amountLamports: amountLamports.toString(),
          status: statusKey,
          resultHash:
            statusKey === "submitted" || statusKey === "completed"
              ? Buffer.from(resultHash).toString("hex")
              : null,
          deadline: new Date(deadline * 1000).toISOString(),
          deadlineTs: deadline,
          isExpired: now > deadline && statusKey === "open",
          createdAt: new Date(createdAt * 1000).toISOString(),
          zkVerified,
        });
      } catch {
        // Skip incompatible accounts
      }
    }

    // Sort by deadline (most urgent first)
    tasks.sort((a, b) => a.deadlineTs - b.deadlineTs);

    return NextResponse.json({
      success: true,
      count: tasks.length,
      tasks,
      filters: {
        requester: requester || null,
        provider: provider || null,
        status: status || null,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
