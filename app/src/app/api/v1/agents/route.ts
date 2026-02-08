/**
 * GET /api/v1/agents
 * List all agents (providers) on the AgentPay protocol
 * Aggregates service data to build agent profiles
 */

import { NextRequest, NextResponse } from "next/server";
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

function trimBytes(arr: number[]): string {
  const buf = Buffer.from(arr);
  const end = buf.indexOf(0);
  return buf.subarray(0, end === -1 ? buf.length : end).toString("utf-8");
}

interface ServiceData {
  pda: string;
  description: string;
  priceSol: string;
  isActive: boolean;
  tasksCompleted: number;
  createdAt: number;
}

interface AgentProfile {
  wallet: string;
  services: ServiceData[];
  stats: {
    totalServices: number;
    activeServices: number;
    totalTasksCompleted: number;
    zkVerifiedCount: number;
    disputeCount: number;
    firstSeen: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const minTasks = searchParams.get("minTasks");

  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // Fetch all services and tasks in parallel
    const [rawServiceAccounts, rawTaskAccounts] = await Promise.all([
      connection.getProgramAccounts(PROGRAM_ID, {
        filters: [{ dataSize: SERVICE_LISTING_SIZE }],
      }),
      connection.getProgramAccounts(PROGRAM_ID, {
        filters: [{ dataSize: TASK_REQUEST_SIZE }],
      }),
    ]);

    // Group services by provider
    const agentServices = new Map<string, ServiceData[]>();
    const agentFirstSeen = new Map<string, number>();

    for (const { pubkey, account } of rawServiceAccounts) {
      try {
        const data = account.data;
        const providerPubkey = new PublicKey(data.subarray(8, 40));
        const description = Array.from(data.subarray(56, 184));
        const priceLamports = data.readBigUInt64LE(184);
        const isActive = data[192] === 1;
        const tasksCompleted = Number(data.readBigUInt64LE(193));
        const createdAt = Number(data.readBigInt64LE(201));

        const providerAddress = providerPubkey.toBase58();

        const service: ServiceData = {
          pda: pubkey.toBase58(),
          description: trimBytes(description),
          priceSol: (Number(priceLamports) / 1e9).toFixed(4),
          isActive,
          tasksCompleted,
          createdAt,
        };

        if (!agentServices.has(providerAddress)) {
          agentServices.set(providerAddress, []);
        }
        agentServices.get(providerAddress)!.push(service);

        // Track first seen
        const existing = agentFirstSeen.get(providerAddress) || Infinity;
        if (createdAt < existing) {
          agentFirstSeen.set(providerAddress, createdAt);
        }
      } catch {
        // Skip incompatible
      }
    }

    // Count task stats per provider
    const providerZkCount = new Map<string, number>();
    const providerDisputeCount = new Map<string, number>();

    for (const { account } of rawTaskAccounts) {
      try {
        const data = account.data;
        const providerPubkey = new PublicKey(data.subarray(40, 72));
        const statusByte = data[384];
        const zkVerified = data[433] === 1;

        const providerAddress = providerPubkey.toBase58();
        const status = STATUS_MAP[statusByte];

        if (zkVerified) {
          providerZkCount.set(providerAddress, (providerZkCount.get(providerAddress) || 0) + 1);
        }

        if (status === "disputed") {
          providerDisputeCount.set(
            providerAddress,
            (providerDisputeCount.get(providerAddress) || 0) + 1
          );
        }
      } catch {
        // Skip incompatible
      }
    }

    // Build agent profiles
    const agents: AgentProfile[] = [];

    for (const [wallet, services] of agentServices) {
      const totalTasksCompleted = services.reduce((sum, s) => sum + s.tasksCompleted, 0);

      // Apply filter
      if (minTasks && totalTasksCompleted < parseInt(minTasks)) continue;

      agents.push({
        wallet,
        services,
        stats: {
          totalServices: services.length,
          activeServices: services.filter((s) => s.isActive).length,
          totalTasksCompleted,
          zkVerifiedCount: providerZkCount.get(wallet) || 0,
          disputeCount: providerDisputeCount.get(wallet) || 0,
          firstSeen: new Date((agentFirstSeen.get(wallet) || 0) * 1000).toISOString(),
        },
      });
    }

    // Sort by total tasks completed
    agents.sort((a, b) => b.stats.totalTasksCompleted - a.stats.totalTasksCompleted);

    return NextResponse.json({
      success: true,
      count: agents.length,
      agents,
      filters: {
        minTasks: minTasks || null,
      },
    });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch agents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
