#!/usr/bin/env node

/**
 * AgentPay Security Monitor
 *
 * Watches all transactions on the AgentPay program and validates:
 * 1. PDA derivation correctness
 * 2. ZK proof verification status on accepted tasks
 * 3. Escrow balance consistency
 * 4. Service listing integrity
 * 5. Suspicious patterns (rapid creates/disputes, deadline gaming)
 */

import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROGRAM_ID = new PublicKey("2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw");
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Load IDL
const idlPath = path.join(__dirname, "..", "cli", "idl.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

// Security report accumulator
const report = {
  timestamp: new Date().toISOString(),
  services: { total: 0, active: 0, suspicious: [] },
  tasks: { total: 0, byStatus: {}, zkVerified: 0, notZkVerified: 0, suspicious: [] },
  escrows: { total: 0, totalLocked: 0, anomalies: [] },
  transactions: { recent: 0, anomalies: [] },
  alerts: [],
};

// ─── Check 1: Service Listing Integrity ───

async function auditServices() {
  console.log("🔍 Auditing service listings...");

  try {
    const program = new Program(idl, PROGRAM_ID, { connection });
    const services = await program.account.serviceListing.all();

    report.services.total = services.length;

    for (const svc of services) {
      const data = svc.account;

      // Check PDA derivation
      const [expectedPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("service"), data.provider.toBuffer()],
        PROGRAM_ID
      );

      if (!expectedPda.equals(svc.publicKey)) {
        report.alerts.push({
          severity: "CRITICAL",
          type: "PDA_MISMATCH",
          message: `ServiceListing PDA mismatch: expected ${expectedPda.toBase58()}, got ${svc.publicKey.toBase58()}`,
          provider: data.provider.toBase58(),
        });
      }

      if (data.isActive) {
        report.services.active++;
      }

      // Check for suspicious pricing (near-zero or extremely high)
      const priceLamports = data.price.toNumber();
      if (priceLamports > 0 && priceLamports < 1000) { // < 0.000001 SOL
        report.services.suspicious.push({
          pda: svc.publicKey.toBase58(),
          provider: data.provider.toBase58(),
          price: priceLamports,
          reason: "Suspiciously low price — possible spam or bait",
        });
      }

      if (priceLamports > 100_000_000_000) { // > 100 SOL
        report.services.suspicious.push({
          pda: svc.publicKey.toBase58(),
          provider: data.provider.toBase58(),
          price: priceLamports,
          reason: "Extremely high price — possible escrow drain attempt",
        });
      }
    }

    console.log(`   ${report.services.total} services found (${report.services.active} active)`);
    if (report.services.suspicious.length > 0) {
      console.log(`   ⚠️  ${report.services.suspicious.length} suspicious services detected`);
    }
  } catch (e) {
    console.log(`   ⚠️  Could not audit services: ${e.message}`);
  }
}

// ─── Check 2: Task Integrity & ZK Verification ───

async function auditTasks() {
  console.log("🔍 Auditing task requests...");

  try {
    const program = new Program(idl, PROGRAM_ID, { connection });
    const tasks = await program.account.taskRequest.all();

    report.tasks.total = tasks.length;

    for (const task of tasks) {
      const data = task.account;
      const status = Object.keys(data.status)[0];

      report.tasks.byStatus[status] = (report.tasks.byStatus[status] || 0) + 1;

      // Track ZK verification
      if (data.zkVerified) {
        report.tasks.zkVerified++;
      } else {
        report.tasks.notZkVerified++;
      }

      // CRITICAL: Check if a completed task was accepted WITHOUT ZK verification
      if (status === "completed" && !data.zkVerified) {
        report.tasks.suspicious.push({
          pda: task.publicKey.toBase58(),
          requester: data.requester.toBase58(),
          reason: "Task completed/accepted without ZK verification — escrow released without proof",
          severity: "HIGH",
        });
        report.alerts.push({
          severity: "HIGH",
          type: "UNVERIFIED_ACCEPTANCE",
          message: `Task ${task.publicKey.toBase58()} was accepted without zkVerified=true`,
          requester: data.requester.toBase58(),
        });
      }

      // Check for deadline gaming: tasks with very short deadlines
      const now = Math.floor(Date.now() / 1000);
      const deadline = data.deadline.toNumber();
      const created = data.createdAt?.toNumber?.() || 0;

      if (deadline - created > 0 && deadline - created < 120 && status === "expired") {
        report.tasks.suspicious.push({
          pda: task.publicKey.toBase58(),
          requester: data.requester.toBase58(),
          reason: "Task had < 2 min deadline and expired — possible deadline gaming",
          severity: "MEDIUM",
        });
      }
    }

    console.log(`   ${report.tasks.total} tasks found`);
    console.log(`   Status breakdown: ${JSON.stringify(report.tasks.byStatus)}`);
    console.log(`   ZK verified: ${report.tasks.zkVerified} | Not verified: ${report.tasks.notZkVerified}`);
    if (report.tasks.suspicious.length > 0) {
      console.log(`   ⚠️  ${report.tasks.suspicious.length} suspicious tasks detected`);
    }
  } catch (e) {
    console.log(`   ⚠️  Could not audit tasks: ${e.message}`);
  }
}

// ─── Check 3: Escrow Balance Consistency ───

async function auditEscrows() {
  console.log("🔍 Auditing escrow vaults...");

  try {
    const program = new Program(idl, PROGRAM_ID, { connection });
    const tasks = await program.account.taskRequest.all();

    for (const task of tasks) {
      const data = task.account;
      const status = Object.keys(data.status)[0];

      // Only open/submitted tasks should have funds in escrow
      if (status === "open" || status === "submitted") {
        const [escrowPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("escrow"), task.publicKey.toBuffer()],
          PROGRAM_ID
        );

        try {
          const escrowBalance = await connection.getBalance(escrowPda);
          report.escrows.total++;
          report.escrows.totalLocked += escrowBalance;

          if (escrowBalance === 0) {
            report.escrows.anomalies.push({
              taskPda: task.publicKey.toBase58(),
              escrowPda: escrowPda.toBase58(),
              status,
              reason: "Escrow vault is empty for an active task — funds may have been drained",
              severity: "CRITICAL",
            });
            report.alerts.push({
              severity: "CRITICAL",
              type: "EMPTY_ESCROW",
              message: `Escrow ${escrowPda.toBase58()} is empty for active task ${task.publicKey.toBase58()}`,
            });
          }
        } catch (e) {
          // Escrow account may not exist
        }
      }
    }

    console.log(`   ${report.escrows.total} active escrows`);
    console.log(`   Total locked: ${(report.escrows.totalLocked / 1e9).toFixed(4)} SOL`);
    if (report.escrows.anomalies.length > 0) {
      console.log(`   🚨 ${report.escrows.anomalies.length} escrow anomalies detected`);
    }
  } catch (e) {
    console.log(`   ⚠️  Could not audit escrows: ${e.message}`);
  }
}

// ─── Check 4: Recent Transaction Analysis ───

async function auditRecentTransactions() {
  console.log("🔍 Analyzing recent transactions...");

  try {
    const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
      limit: 50,
    });

    report.transactions.recent = signatures.length;

    // Check for rapid-fire transactions from same wallet (possible bot abuse)
    const walletActivity = {};

    for (const sig of signatures) {
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (tx?.transaction?.message?.accountKeys) {
          const signer = tx.transaction.message.accountKeys[0]?.pubkey?.toBase58();
          if (signer) {
            if (!walletActivity[signer]) walletActivity[signer] = [];
            walletActivity[signer].push(sig.blockTime || 0);
          }
        }
      } catch (e) {
        // Skip transactions that can't be parsed
      }
    }

    // Detect rapid-fire activity (> 10 txs in 60 seconds from same wallet)
    for (const [wallet, timestamps] of Object.entries(walletActivity)) {
      timestamps.sort((a, b) => a - b);
      for (let i = 0; i < timestamps.length - 10; i++) {
        if (timestamps[i + 10] - timestamps[i] < 60) {
          report.transactions.anomalies.push({
            wallet,
            reason: `${timestamps.length} transactions in rapid succession — possible automated abuse`,
            severity: "MEDIUM",
          });
          break;
        }
      }
    }

    console.log(`   ${report.transactions.recent} recent transactions analyzed`);
  } catch (e) {
    console.log(`   ⚠️  Could not fetch recent transactions: ${e.message}`);
  }
}

// ─── Generate Report ───

function generateReport() {
  const alertCount = report.alerts.length;
  const criticals = report.alerts.filter(a => a.severity === "CRITICAL").length;
  const highs = report.alerts.filter(a => a.severity === "HIGH").length;
  const mediums = report.alerts.filter(a => a.severity === "MEDIUM").length;

  const statusEmoji = criticals > 0 ? "🚨" : highs > 0 ? "⚠️" : "✅";

  let md = `# ${statusEmoji} AgentPay Security Report\n\n`;
  md += `**Timestamp:** ${report.timestamp}\n`;
  md += `**Program:** \`${PROGRAM_ID.toBase58()}\`\n`;
  md += `**Network:** Solana devnet\n`;
  md += `**Agent:** agentpay-sentinel\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Services | ${report.services.total} (${report.services.active} active) |\n`;
  md += `| Tasks | ${report.tasks.total} |\n`;
  md += `| ZK Verified | ${report.tasks.zkVerified} of ${report.tasks.total} |\n`;
  md += `| Active Escrows | ${report.escrows.total} |\n`;
  md += `| SOL Locked | ${(report.escrows.totalLocked / 1e9).toFixed(4)} |\n`;
  md += `| Recent Txs | ${report.transactions.recent} |\n`;
  md += `| Alerts | ${alertCount} (${criticals} critical, ${highs} high, ${mediums} medium) |\n\n`;

  if (report.alerts.length > 0) {
    md += `## Alerts\n\n`;
    for (const alert of report.alerts) {
      const icon = alert.severity === "CRITICAL" ? "🚨" : alert.severity === "HIGH" ? "⚠️" : "ℹ️";
      md += `### ${icon} ${alert.severity}: ${alert.type}\n\n`;
      md += `${alert.message}\n\n`;
    }
  }

  md += `## Task Status Breakdown\n\n`;
  for (const [status, count] of Object.entries(report.tasks.byStatus)) {
    md += `- **${status}**: ${count}\n`;
  }
  md += `\n`;

  if (report.services.suspicious.length > 0) {
    md += `## Suspicious Services\n\n`;
    for (const svc of report.services.suspicious) {
      md += `- \`${svc.pda}\`: ${svc.reason} (${svc.price} lamports)\n`;
    }
    md += `\n`;
  }

  if (report.tasks.suspicious.length > 0) {
    md += `## Suspicious Tasks\n\n`;
    for (const task of report.tasks.suspicious) {
      md += `- \`${task.pda}\`: ${task.reason}\n`;
    }
    md += `\n`;
  }

  md += `---\n*Generated by agentpay-sentinel — autonomous security watchdog*\n`;

  return md;
}

// ─── Main ───

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  AgentPay Sentinel — Security Audit");
  console.log(`  ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════\n");

  await auditServices();
  await auditTasks();
  await auditEscrows();
  await auditRecentTransactions();

  const reportMd = generateReport();

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write report to file
  const reportPath = path.join(reportsDir, `report-${Date.now()}.md`);
  fs.writeFileSync(reportPath, reportMd);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  console.log("\n" + reportMd);

  // Return report and alerts for the cron job to post
  return { report, reportMd };
}

main().catch(console.error);
