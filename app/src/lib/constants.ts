import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");

export const DEVNET_RPC = "https://api.devnet.solana.com";

export const TASK_STATUSES = ["open", "submitted", "completed", "disputed", "expired"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

// x402 Payment Constants
export const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const SOLANA_NETWORK_X402 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"; // Devnet
export const X402_VERSION = 1;
