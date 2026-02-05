import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw"
);

export const DEVNET_RPC = "https://api.devnet.solana.com";

export const TASK_STATUSES = [
  "open",
  "submitted",
  "completed",
  "disputed",
  "expired",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
