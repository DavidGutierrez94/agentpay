/**
 * Service-related MCP tools for AgentPay
 * - search_services: Find services by keyword/price/reputation
 * - get_service: Get details of a specific service
 */

import { PublicKey } from "@solana/web3.js";
import {
  getProgram,
  getConnection,
  PROGRAM_ID,
  SERVICE_LISTING_SIZE,
  trimBytes,
  lamportsToSol,
} from "./program.mjs";

/**
 * Search for services on the AgentPay marketplace
 * @param {Object} params
 * @param {string} [params.query] - Search term for service descriptions
 * @param {number} [params.maxPrice] - Maximum price in SOL
 * @param {number} [params.minReputation] - Minimum tasks completed
 * @returns {Object} - List of matching services
 */
export async function searchServices({ query, maxPrice, minReputation } = {}) {
  const { program } = getProgram();
  const connection = getConnection();

  // Fetch all service accounts with correct size
  const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [{ dataSize: SERVICE_LISTING_SIZE }],
  });

  const services = [];

  for (const { pubkey, account } of rawAccounts) {
    try {
      const decoded = program.coder.accounts.decode("serviceListing", account.data);

      // Skip inactive services
      if (!decoded.isActive) continue;

      const priceSol = Number(decoded.priceLamports) / 1e9;
      const tasksCompleted = decoded.tasksCompleted.toNumber();
      const description = trimBytes(decoded.description);

      // Apply filters
      if (maxPrice !== undefined && priceSol > maxPrice) continue;
      if (minReputation !== undefined && tasksCompleted < minReputation) continue;
      if (query && !description.toLowerCase().includes(query.toLowerCase())) continue;

      services.push({
        pda: pubkey.toBase58(),
        provider: decoded.provider.toBase58(),
        serviceId: Buffer.from(decoded.serviceId).toString("hex"),
        description,
        priceSol: priceSol.toFixed(4),
        priceLamports: decoded.priceLamports.toString(),
        tasksCompleted,
        minReputation: decoded.minReputation.toString(),
        isActive: decoded.isActive,
        createdAt: new Date(decoded.createdAt.toNumber() * 1000).toISOString(),
      });
    } catch {
      // Skip incompatible accounts
    }
  }

  // Sort by tasks completed (reputation)
  services.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

  return {
    success: true,
    count: services.length,
    services,
    filters: {
      query: query || null,
      maxPrice: maxPrice || null,
      minReputation: minReputation || null,
    },
  };
}

/**
 * Get details of a specific service
 * @param {Object} params
 * @param {string} params.servicePda - The service PDA address
 * @returns {Object} - Service details
 */
export async function getService({ servicePda }) {
  const { program } = getProgram();
  const connection = getConnection();

  const pubkey = new PublicKey(servicePda);
  const accountInfo = await connection.getAccountInfo(pubkey);

  if (!accountInfo) {
    return {
      success: false,
      error: "Service not found",
      servicePda,
    };
  }

  try {
    const decoded = program.coder.accounts.decode("serviceListing", accountInfo.data);

    return {
      success: true,
      service: {
        pda: servicePda,
        provider: decoded.provider.toBase58(),
        serviceId: Buffer.from(decoded.serviceId).toString("hex"),
        description: trimBytes(decoded.description),
        priceSol: lamportsToSol(decoded.priceLamports),
        priceLamports: decoded.priceLamports.toString(),
        tasksCompleted: decoded.tasksCompleted.toNumber(),
        minReputation: decoded.minReputation.toString(),
        isActive: decoded.isActive,
        createdAt: new Date(decoded.createdAt.toNumber() * 1000).toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to decode service account",
      details: error.message,
      servicePda,
    };
  }
}

/**
 * Tool definitions for MCP
 */
export const serviceTools = [
  {
    name: "search_services",
    description:
      "Search for available services on the AgentPay marketplace. Returns a list of services that match the search criteria. Services are sorted by reputation (tasks completed).",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term to match against service descriptions",
        },
        maxPrice: {
          type: "number",
          description: "Maximum price in SOL (e.g., 0.1 for 0.1 SOL)",
        },
        minReputation: {
          type: "number",
          description: "Minimum number of tasks completed by the provider",
        },
      },
    },
  },
  {
    name: "get_service",
    description:
      "Get detailed information about a specific service by its PDA (Program Derived Address). Returns the service description, price, provider, and reputation stats.",
    inputSchema: {
      type: "object",
      properties: {
        servicePda: {
          type: "string",
          description: "The service PDA address (base58 encoded)",
        },
      },
      required: ["servicePda"],
    },
  },
];
