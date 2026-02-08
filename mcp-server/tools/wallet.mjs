/**
 * Wallet-related MCP tools for AgentPay
 * - get_balance: Check SOL balance
 * - scan_wallet: REKT Shield risk scan
 */

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getProgram, getConnection, lamportsToSol } from "./program.mjs";

// REKT Shield API endpoint
const REKT_SHIELD_API =
  process.env.REKT_SHIELD_API ||
  "https://web-production-c5ac4.up.railway.app/api/scan";

/**
 * Get wallet SOL balance
 * @returns {Object} - Balance information
 */
export async function getBalance() {
  const { keypair } = getProgram();
  const connection = getConnection();

  const balance = await connection.getBalance(keypair.publicKey);

  return {
    success: true,
    wallet: keypair.publicKey.toBase58(),
    balanceSol: lamportsToSol(balance),
    balanceLamports: balance,
    network: process.env.AGENTPAY_RPC?.includes("mainnet") ? "mainnet" : "devnet",
  };
}

/**
 * Scan a wallet for risk using REKT Shield
 * @param {Object} params
 * @param {string} params.walletAddress - The wallet address to scan
 * @returns {Object} - Risk assessment
 */
export async function scanWallet({ walletAddress }) {
  try {
    const response = await fetch(`${REKT_SHIELD_API}/${walletAddress}`);

    if (!response.ok) {
      // REKT Shield might return 404 for unknown wallets
      if (response.status === 404) {
        return {
          success: true,
          wallet: walletAddress,
          riskScore: 0,
          riskLevel: "unknown",
          message: "Wallet not found in REKT Shield database. No known risk factors.",
          recommendation: "Proceed with caution for new/unknown wallets.",
        };
      }

      throw new Error(`REKT Shield API error: ${response.status}`);
    }

    const data = await response.json();

    // Interpret risk score
    let riskLevel;
    let recommendation;

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

    return {
      success: true,
      wallet: walletAddress,
      riskScore: data.score,
      riskLevel,
      flags: data.flags || [],
      message: data.message || null,
      recommendation,
      scannedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Don't fail the whole operation if REKT Shield is down
    return {
      success: false,
      wallet: walletAddress,
      error: "Failed to scan wallet",
      details: error.message,
      recommendation: "REKT Shield unavailable. Proceed with your own due diligence.",
    };
  }
}

/**
 * Tool definitions for MCP
 */
export const walletTools = [
  {
    name: "get_balance",
    description:
      "Check the SOL balance of your agent wallet. Returns the balance in SOL and lamports.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "scan_wallet",
    description:
      "Scan a wallet address for risk factors using REKT Shield. Returns a risk score (0-100) and risk level. Use this before transacting with unknown wallets.",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: {
          type: "string",
          description: "The Solana wallet address to scan",
        },
      },
      required: ["walletAddress"],
    },
  },
];
