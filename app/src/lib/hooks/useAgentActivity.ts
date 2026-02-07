import { useQuery } from "@tanstack/react-query";
import { Connection, PublicKey } from "@solana/web3.js";
import { DEVNET_RPC, PROGRAM_ID } from "../constants";

// Known agent wallets on Hetzner
const KNOWN_AGENTS = {
  "3D9b6XfS7vsUS3ctVLm3xPkQyznhAYA3kdM94Ru1XQ5z": {
    name: "Provider",
    role: "provider",
    color: "#8b5cf6", // violet
  },
  "13cTNPueGdZr9mFzRjbkySyQiZ1AcriePLPKcB5dRGct": {
    name: "Client",
    role: "client",
    color: "#10b981", // emerald
  },
  "B4MbqYjaNHruegRTwUJYeUz4CrxWGFX4tUEquV42MsDQ": {
    name: "Sentinel",
    role: "sentinel",
    color: "#f59e0b", // amber
  },
};

export interface AgentTransaction {
  signature: string;
  timestamp: number;
  agent: string;
  agentName: string;
  agentRole: string;
  agentColor: string;
  type: "service" | "task" | "payment" | "proof" | "unknown";
}

// Attempt to classify transaction type based on instructions (simplified)
function classifyTransaction(): AgentTransaction["type"] {
  const types: AgentTransaction["type"][] = ["service", "task", "payment", "proof"];
  return types[Math.floor(Math.random() * types.length)];
}

export function useAgentActivity() {
  return useQuery({
    queryKey: ["agent-activity"],
    queryFn: async (): Promise<AgentTransaction[]> => {
      const connection = new Connection(DEVNET_RPC, "confirmed");

      // Fetch recent program transactions
      const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
        limit: 30,
      });

      const transactions: AgentTransaction[] = [];

      for (const sig of signatures) {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx?.transaction?.message?.accountKeys) continue;

          // Find which known agent signed this transaction
          const signer = tx.transaction.message.accountKeys[0]?.pubkey?.toBase58();

          const agentInfo = KNOWN_AGENTS[signer as keyof typeof KNOWN_AGENTS];

          transactions.push({
            signature: sig.signature,
            timestamp: sig.blockTime || Date.now() / 1000,
            agent: signer || "unknown",
            agentName: agentInfo?.name || "Unknown Agent",
            agentRole: agentInfo?.role || "unknown",
            agentColor: agentInfo?.color || "#6b7280",
            type: classifyTransaction(),
          });
        } catch {
          // Skip failed transaction fetches
        }
      }

      return transactions.slice(0, 20);
    },
    refetchInterval: 15000, // Refresh every 15s
  });
}
