/**
 * GET /api/v1/scan/:wallet
 * REKT Shield risk scan proxy
 */

import { NextRequest, NextResponse } from "next/server";

const REKT_SHIELD_API =
  process.env.REKT_SHIELD_API ||
  "https://web-production-c5ac4.up.railway.app/api/scan";

// Simple rate limiting (in-memory, resets on restart)
const scanCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function isValidPublicKey(input: string): boolean {
  // Base58 characters only, 32-44 chars typical for Solana addresses
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;

  // Validate wallet format
  if (!isValidPublicKey(wallet)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid wallet address format",
        wallet,
      },
      { status: 400 }
    );
  }

  // Check cache
  const cached = scanCache.get(wallet);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      cached: true,
      ...cached.data,
    });
  }

  try {
    const response = await fetch(`${REKT_SHIELD_API}/${wallet}`, {
      headers: {
        "User-Agent": "AgentPay/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        const result = {
          wallet,
          riskScore: 0,
          riskLevel: "unknown" as const,
          message: "Wallet not found in REKT Shield database",
          recommendation: "Proceed with caution for new/unknown wallets",
          scannedAt: new Date().toISOString(),
        };

        // Cache the result
        scanCache.set(wallet, { data: result, timestamp: Date.now() });

        return NextResponse.json({
          success: true,
          cached: false,
          ...result,
        });
      }

      throw new Error(`REKT Shield API error: ${response.status}`);
    }

    const data = await response.json();

    // Interpret risk score
    let riskLevel: "low" | "medium" | "high" | "critical" | "unknown";
    let recommendation: string;

    if (data.score === undefined || data.score === null) {
      riskLevel = "unknown";
      recommendation = "Unable to assess risk. Proceed with caution.";
    } else if (data.score <= 20) {
      riskLevel = "low";
      recommendation = "Low risk. Safe to proceed with transactions.";
    } else if (data.score <= 50) {
      riskLevel = "medium";
      recommendation = "Medium risk. Consider limiting transaction amounts.";
    } else if (data.score <= 70) {
      riskLevel = "high";
      recommendation = "High risk. Recommend avoiding large transactions.";
    } else {
      riskLevel = "critical";
      recommendation = "Critical risk. Do not transact with this wallet.";
    }

    const result = {
      wallet,
      riskScore: data.score,
      riskLevel,
      flags: data.flags || [],
      message: data.message || null,
      recommendation,
      scannedAt: new Date().toISOString(),
    };

    // Cache the result
    scanCache.set(wallet, { data: result, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      cached: false,
      ...result,
    });
  } catch (error) {
    console.error("REKT Shield scan error:", error);
    return NextResponse.json(
      {
        success: false,
        wallet,
        error: "Failed to scan wallet",
        details: error instanceof Error ? error.message : "Unknown error",
        recommendation: "REKT Shield unavailable. Proceed with your own due diligence.",
      },
      { status: 503 }
    );
  }
}
