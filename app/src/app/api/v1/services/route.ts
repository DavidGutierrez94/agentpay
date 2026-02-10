/**
 * GET /api/v1/services
 * List all services on the AgentPay marketplace
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { type NextRequest, NextResponse } from "next/server";

const PROGRAM_ID = new PublicKey("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
const SERVICE_LISTING_SIZE = 218;

function trimBytes(arr: number[]): string {
  const buf = Buffer.from(arr);
  const end = buf.indexOf(0);
  return buf.subarray(0, end === -1 ? buf.length : end).toString("utf-8");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const maxPrice = searchParams.get("maxPrice");
  const minReputation = searchParams.get("minReputation");
  const provider = searchParams.get("provider");

  try {
    const connection = new Connection(RPC_URL, "confirmed");

    // Fetch all service accounts with correct size
    const filters: Array<{ dataSize: number } | { memcmp: { offset: number; bytes: string } }> = [
      { dataSize: SERVICE_LISTING_SIZE },
    ];

    if (provider) {
      filters.push({
        memcmp: {
          offset: 8, // after discriminator
          bytes: provider,
        },
      });
    }

    const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });

    // We need to decode the accounts manually since we don't have the full program
    // Account layout: discriminator(8) + provider(32) + serviceId(16) + description(128) + ...
    const services = [];

    for (const { pubkey, account } of rawAccounts) {
      try {
        const data = account.data;

        // Parse account data (ServiceListing layout)
        // 8 bytes discriminator
        // 32 bytes provider
        // 16 bytes serviceId
        // 128 bytes description
        // 8 bytes priceLamports
        // 1 byte isActive
        // 8 bytes tasksCompleted
        // 8 bytes createdAt
        // 8 bytes minReputation
        // 1 byte bump

        const providerPubkey = new PublicKey(data.subarray(8, 40));
        const serviceId = data.subarray(40, 56);
        const description = Array.from(data.subarray(56, 184));
        const priceLamports = data.readBigUInt64LE(184);
        const isActive = data[192] === 1;
        const tasksCompleted = Number(data.readBigUInt64LE(193));
        const createdAt = Number(data.readBigInt64LE(201));
        const minReputationValue = Number(data.readBigUInt64LE(209));

        // Skip inactive services
        if (!isActive) continue;

        const priceSol = Number(priceLamports) / 1e9;
        const descriptionStr = trimBytes(description);

        // Apply filters
        if (maxPrice && priceSol > parseFloat(maxPrice)) continue;
        if (minReputation && tasksCompleted < parseInt(minReputation, 10)) continue;
        if (query && !descriptionStr.toLowerCase().includes(query.toLowerCase())) continue;

        services.push({
          pda: pubkey.toBase58(),
          provider: providerPubkey.toBase58(),
          serviceId: Buffer.from(serviceId).toString("hex"),
          description: descriptionStr,
          priceSol: priceSol.toFixed(4),
          priceLamports: priceLamports.toString(),
          tasksCompleted,
          minReputation: minReputationValue,
          isActive,
          createdAt: new Date(createdAt * 1000).toISOString(),
        });
      } catch {
        // Skip incompatible accounts
      }
    }

    // Sort by tasks completed (reputation)
    services.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    return NextResponse.json({
      success: true,
      count: services.length,
      services,
      filters: {
        query: query || null,
        maxPrice: maxPrice || null,
        minReputation: minReputation || null,
        provider: provider || null,
      },
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch services",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
