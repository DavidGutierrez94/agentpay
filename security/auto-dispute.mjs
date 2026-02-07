#!/usr/bin/env node

/**
 * Auto-dispute tasks that were accepted without ZK verification.
 *
 * This is the sentinel's enforcement mechanism. If it detects a completed
 * task where zkVerified === false, it can trigger a dispute to refund
 * the requester.
 *
 * NOTE: Only the requester can actually call dispute_task on-chain.
 * The sentinel can only alert and recommend disputes. For the demo,
 * Agent B (client) should have a listener that acts on sentinel alerts.
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROGRAM_ID = new PublicKey("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const idlPath = path.join(__dirname, "..", "cli", "idl.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

async function checkAndAlert() {
  try {
    const program = new Program(idl, PROGRAM_ID, { connection });
    const tasks = await program.account.taskRequest.all();

    const unverifiedCompletions = tasks.filter(t => {
      const status = Object.keys(t.account.status)[0];
      return status === "submitted" && !t.account.zkVerified;
    });

    if (unverifiedCompletions.length > 0) {
      console.log(`🚨 ALERT: ${unverifiedCompletions.length} submitted tasks WITHOUT ZK verification:`);
      for (const task of unverifiedCompletions) {
        console.log(`   Task PDA: ${task.publicKey.toBase58()}`);
        console.log(`   Requester: ${task.account.requester.toBase58()}`);
        console.log(`   → RECOMMENDATION: Do NOT accept. Dispute or require ZK proof.\n`);
      }

      // Ensure alerts directory exists
      const alertPath = path.join(__dirname, "alerts");
      if (!fs.existsSync(alertPath)) {
        fs.mkdirSync(alertPath, { recursive: true });
      }

      const alert = {
        timestamp: new Date().toISOString(),
        type: "UNVERIFIED_SUBMISSIONS",
        tasks: unverifiedCompletions.map(t => ({
          pda: t.publicKey.toBase58(),
          requester: t.account.requester.toBase58(),
        })),
        recommendation: "DO_NOT_ACCEPT",
      };

      fs.writeFileSync(
        path.join(alertPath, `alert-${Date.now()}.json`),
        JSON.stringify(alert, null, 2)
      );

      // Also write to latest.txt for easy reading
      fs.writeFileSync(
        path.join(alertPath, "latest.txt"),
        `[${alert.timestamp}] ${unverifiedCompletions.length} unverified submissions detected. DO NOT ACCEPT.`
      );

      return alert;
    } else {
      console.log("✅ All submitted tasks have valid ZK proofs.");

      // Clear latest alert
      const latestPath = path.join(__dirname, "alerts", "latest.txt");
      if (fs.existsSync(latestPath)) {
        fs.writeFileSync(latestPath, `[${new Date().toISOString()}] All clear - no unverified submissions.`);
      }

      return null;
    }
  } catch (e) {
    console.error("❌ Error checking tasks:", e.message);
    return null;
  }
}

checkAndAlert().catch(console.error);
