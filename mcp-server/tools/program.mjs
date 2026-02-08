/**
 * Shared Anchor program setup for AgentPay MCP tools
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import web3 from "@solana/web3.js";
const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = web3;
import anchor from "@coral-xyz/anchor";
const { AnchorProvider, Program, Wallet } = anchor;

// ============================================================================
// Constants
// ============================================================================

export const PROGRAM_ID = new PublicKey(
  "2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw"
);

export const DEFAULT_RPC = process.env.AGENTPAY_RPC || "https://api.devnet.solana.com";

// Account sizes for filtering (skip legacy accounts)
export const SERVICE_LISTING_SIZE = 218;
export const TASK_REQUEST_SIZE = 435;

// ============================================================================
// IDL Loading
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const IDL_PATH = join(__dirname, "../../cli/idl.json");

let cachedIdl = null;

export function getIdl() {
  if (!cachedIdl) {
    cachedIdl = JSON.parse(readFileSync(IDL_PATH, "utf-8"));
  }
  return cachedIdl;
}

// ============================================================================
// Keypair Loading
// ============================================================================

export function loadKeypair(path) {
  const resolved = path.replace("~", homedir());
  const raw = readFileSync(resolved, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

export function getKeypairPath() {
  return process.env.AGENTPAY_KEYPAIR || "~/.config/solana/id.json";
}

// ============================================================================
// Program & Connection
// ============================================================================

let cachedConnection = null;
let cachedProgram = null;
let cachedKeypair = null;

export function getConnection() {
  if (!cachedConnection) {
    cachedConnection = new Connection(DEFAULT_RPC, "confirmed");
  }
  return cachedConnection;
}

export function getProgram() {
  if (!cachedProgram) {
    const connection = getConnection();
    const keypair = loadKeypair(getKeypairPath());
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    cachedProgram = new Program(getIdl(), provider);
    cachedKeypair = keypair;
  }
  return { program: cachedProgram, keypair: cachedKeypair, connection: getConnection() };
}

// ============================================================================
// PDA Derivation
// ============================================================================

export function deriveServicePda(provider, serviceId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("service"), provider.toBuffer(), Buffer.from(serviceId)],
    PROGRAM_ID
  );
  return pda;
}

export function deriveTaskPda(requester, taskId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("task"), requester.toBuffer(), Buffer.from(taskId)],
    PROGRAM_ID
  );
  return pda;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function padBytes(str, len) {
  const buf = Buffer.alloc(len);
  buf.write(str, "utf-8");
  return Array.from(buf);
}

export function trimBytes(arr) {
  const buf = Buffer.from(arr);
  const end = buf.indexOf(0);
  return buf.subarray(0, end === -1 ? buf.length : end).toString("utf-8");
}

export function lamportsToSol(lamports) {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4);
}

export function solToLamports(sol) {
  return Math.round(parseFloat(sol) * LAMPORTS_PER_SOL);
}

// ============================================================================
// Task Status Helpers
// ============================================================================

export const TASK_STATUSES = ["open", "submitted", "completed", "disputed", "expired"];

export function getTaskStatusKey(status) {
  return Object.keys(status)[0];
}
