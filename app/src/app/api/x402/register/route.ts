/**
 * POST /api/x402/register
 * Register a service for x402 payments
 */

import { PublicKey } from "@solana/web3.js";
import { type NextRequest, NextResponse } from "next/server";
import { USDC_MINT_DEVNET } from "@/lib/constants";
import { registerX402Service } from "@/lib/x402/config";
import type { X402ServiceConfig } from "@/lib/x402/types";

// Derive Associated Token Address (simplified - using standard derivation)
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
  );
  return address;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { servicePda, priceUsdc, recipientWallet, description } = body;

    // Validate required fields
    if (!servicePda || !priceUsdc || !recipientWallet || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["servicePda", "priceUsdc", "recipientWallet", "description"],
        },
        { status: 400 },
      );
    }

    // Validate wallet address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipientWallet);
    } catch {
      return NextResponse.json({ error: "Invalid recipientWallet address" }, { status: 400 });
    }

    // Calculate recipient's USDC token account
    const usdcMint = new PublicKey(USDC_MINT_DEVNET);
    const recipientTokenAccount = getAssociatedTokenAddress(usdcMint, recipientPubkey);

    // Build config
    const config: X402ServiceConfig = {
      servicePda,
      endpoint: `/api/x402/${servicePda}`,
      priceUsdc: Math.round(priceUsdc * 1_000_000), // Convert to smallest units
      recipientWallet,
      recipientTokenAccount: recipientTokenAccount.toBase58(),
      description,
      createdAt: Date.now(),
    };

    // Register service
    registerX402Service(config);

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        priceUsdc: priceUsdc, // Return human-readable price
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
