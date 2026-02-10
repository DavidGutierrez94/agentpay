import { Connection, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
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
  B4MbqYjaNHruegRTwUJYeUz4CrxWGFX4tUEquV42MsDQ: {
    name: "Sentinel",
    role: "sentinel",
    color: "#f59e0b", // amber
  },
};

// Instruction discriminators from the IDL
const INSTRUCTION_DISCRIMINATORS: Record<string, AgentTransaction["type"]> = {
  // register_service: [11, 133, 158, 232, 193, 19, 229, 73]
  "0b859ee8c113e549": "service",
  // create_task: [194, 80, 6, 180, 232, 127, 48, 171]
  c25006b4e87f30ab: "task",
  // submit_result: [240, 42, 89, 180, 10, 239, 9, 214]
  f02a59b40aef09d6: "proof",
  // submit_result_zk: [98, 173, 167, 164, 217, 231, 142, 199]
  "62ada7a4d9e78ec7": "proof",
  // accept_result: [136, 134, 91, 171, 167, 202, 234, 181]
  "88865baba7caeab5": "payment",
  // dispute_task: [140, 98, 191, 168, 154, 118, 50, 98]
  "8c62bfa89a763262": "dispute",
  // expire_task: [116, 94, 206, 205, 170, 51, 156, 98]
  "745ececdaa339c62": "unknown",
  // deactivate_service: [251, 86, 29, 182, 216, 170, 85, 155]
  fb561db6d8aa559b: "service",
  // verify_reputation: [182, 23, 57, 13, 214, 61, 83, 208]
  b617390dd63d53d0: "proof",
};

export interface AgentTransaction {
  signature: string;
  timestamp: number;
  agent: string;
  agentName: string;
  agentRole: string;
  agentColor: string;
  type: "service" | "task" | "payment" | "proof" | "dispute" | "unknown";
}

/**
 * Classify transaction type based on instruction discriminator
 * Parses the actual on-chain instruction data to determine the type
 */
function classifyTransaction(tx: ParsedTransactionWithMeta | null): AgentTransaction["type"] {
  if (!tx?.transaction?.message?.instructions) {
    return "unknown";
  }

  const instructions = tx.transaction.message.instructions;

  for (const ix of instructions) {
    // Check if this is a program instruction (not parsed system/token instruction)
    if ("data" in ix && "programId" in ix) {
      // Check if it's our program
      const programId = ix.programId;
      if (programId.equals(PROGRAM_ID)) {
        try {
          // Decode base58 data
          const data = ix.data;
          if (typeof data === "string") {
            // Base58 decode the first 8 bytes (discriminator)
            // The data is base58 encoded, we need to extract the discriminator
            const decoded = Buffer.from(data, "base64");
            if (decoded.length >= 8) {
              const discriminator = decoded.slice(0, 8).toString("hex");
              const txType = INSTRUCTION_DISCRIMINATORS[discriminator];
              if (txType) {
                return txType;
              }
            }
          }
        } catch {
          // Failed to parse, continue to next instruction
        }
      }
    }
  }

  return "unknown";
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

          // Classify transaction based on actual instruction data
          const txType = classifyTransaction(tx);

          transactions.push({
            signature: sig.signature,
            timestamp: sig.blockTime || Date.now() / 1000,
            agent: signer || "unknown",
            agentName: agentInfo?.name || "Unknown Agent",
            agentRole: agentInfo?.role || "unknown",
            agentColor: agentInfo?.color || "#6b7280",
            type: txType,
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

// Export network metrics hook for the visualization
export interface NetworkMetrics {
  tvlSol: number;
  txPerMinute: number;
  completionRate: number;
  activeAgents: number;
  totalTransactions: number;
}

export function useNetworkMetrics() {
  return useQuery({
    queryKey: ["network-metrics"],
    queryFn: async (): Promise<NetworkMetrics> => {
      const connection = new Connection(DEVNET_RPC, "confirmed");

      // Fetch recent program transactions for metrics
      const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
        limit: 100,
      });

      // Calculate transactions per minute (last 100 tx)
      const now = Date.now() / 1000;
      const oneMinuteAgo = now - 60;
      const recentTxCount = signatures.filter(
        (sig) => sig.blockTime && sig.blockTime > oneMinuteAgo,
      ).length;

      // Get unique signers (active agents)
      const uniqueSigners = new Set<string>();
      let completedTasks = 0;
      let totalTasks = 0;

      for (const sig of signatures.slice(0, 30)) {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          if (tx?.transaction?.message?.accountKeys?.[0]?.pubkey) {
            uniqueSigners.add(tx.transaction.message.accountKeys[0].pubkey.toBase58());
          }

          // Count task completions (accept_result)
          const txType = classifyTransaction(tx);
          if (txType === "task") totalTasks++;
          if (txType === "payment") completedTasks++;
        } catch {
          // Skip failed fetches
        }
      }

      // Calculate TVL (simplified - would need to aggregate from all open tasks)
      // For demo, estimate based on activity
      const estimatedTvl = (totalTasks - completedTasks) * 0.1; // Assume avg 0.1 SOL per task

      return {
        tvlSol: Math.max(0, estimatedTvl),
        txPerMinute: recentTxCount,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        activeAgents: uniqueSigners.size,
        totalTransactions: signatures.length,
      };
    },
    refetchInterval: 30000, // Refresh every 30s
  });
}
