/**
 * GET /api/v1/stats
 * Get protocol statistics
 */

import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const SERVICE_LISTING_SIZE = 218;
const TASK_REQUEST_SIZE = 435;

const STATUS_MAP: Record<number, string> = {
  0: "open",
  1: "submitted",
  2: "completed",
  3: "disputed",
  4: "expired",
};

export async function GET() {
  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // Fetch all accounts in parallel
    const [rawServiceAccounts, rawTaskAccounts] = await Promise.all([
      connection.getProgramAccounts(PROGRAM_ID, {
        filters: [{ dataSize: SERVICE_LISTING_SIZE }],
      }),
      connection.getProgramAccounts(PROGRAM_ID, {
        filters: [{ dataSize: TASK_REQUEST_SIZE }],
      }),
    ]);

    // Parse services
    const services: { provider: string; tasksCompleted: number; isActive: boolean }[] = [];
    for (const { account } of rawServiceAccounts) {
      try {
        const data = account.data;
        const providerPubkey = new PublicKey(data.subarray(8, 40));
        const isActive = data[192] === 1;
        const tasksCompleted = Number(data.readBigUInt64LE(193));

        services.push({
          provider: providerPubkey.toBase58(),
          tasksCompleted,
          isActive,
        });
      } catch {
        // Skip incompatible
      }
    }

    // Parse tasks
    const tasks: { status: string; amountLamports: bigint; zkVerified: boolean }[] = [];
    for (const { account } of rawTaskAccounts) {
      try {
        const data = account.data;
        const amountLamports = data.readBigUInt64LE(376);
        const statusByte = data[384];
        const zkVerified = data[433] === 1;

        tasks.push({
          status: STATUS_MAP[statusByte] || "unknown",
          amountLamports,
          zkVerified,
        });
      } catch {
        // Skip incompatible
      }
    }

    // Calculate stats
    const tasksByStatus: Record<string, number> = {
      open: 0,
      submitted: 0,
      completed: 0,
      disputed: 0,
      expired: 0,
    };

    let escrowLockedLamports = BigInt(0);
    let zkVerifiedCount = 0;

    for (const t of tasks) {
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
      if (t.status === "open" || t.status === "submitted") {
        escrowLockedLamports += t.amountLamports;
      }
      if (t.zkVerified) {
        zkVerifiedCount++;
      }
    }

    // Top providers by tasks completed
    const providerMap = new Map<string, number>();
    for (const s of services) {
      providerMap.set(
        s.provider,
        (providerMap.get(s.provider) || 0) + s.tasksCompleted
      );
    }

    const topProviders = Array.from(providerMap.entries())
      .map(([address, tasksCompleted]) => ({ address, tasksCompleted }))
      .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      stats: {
        services: {
          total: services.length,
          active: services.filter((s) => s.isActive).length,
        },
        tasks: {
          total: tasks.length,
          byStatus: tasksByStatus,
          zkVerified: zkVerifiedCount,
          zkVerificationRate:
            tasks.length > 0 ? ((zkVerifiedCount / tasks.length) * 100).toFixed(1) + "%" : "0%",
        },
        escrow: {
          lockedSol: (Number(escrowLockedLamports) / 1e9).toFixed(4),
          lockedLamports: escrowLockedLamports.toString(),
        },
        topProviders,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
