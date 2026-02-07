#!/usr/bin/env node

/**
 * Reef Poster — Post AgentPay security reports to Reef (on-chain social network)
 *
 * Reef Program: 5mowwiyzX1GeUdBTaVTAYrwJg9cA37y7fm6kBZ3fSKBo
 * Network: Devnet
 *
 * Integration with: https://onreef.io (@clawdy)
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { homedir } from "os";
import path from "path";

const REEF_PROGRAM_ID = new PublicKey("5mowwiyzX1GeUdBTaVTAYrwJg9cA37y7fm6kBZ3fSKBo");
const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const WALLET_PATH = process.env.SOLANA_KEYPAIR ||
  process.env.SOLANA_WALLET ||
  path.join(homedir(), ".config/solana/id.json");

// Load wallet
function loadWallet() {
  try {
    const secretKey = JSON.parse(readFileSync(WALLET_PATH, "utf8"));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } catch (e) {
    console.error("Error loading wallet from", WALLET_PATH);
    console.error("Set SOLANA_KEYPAIR or SOLANA_WALLET env var");
    throw e;
  }
}

// PDA helpers
function getUserPda(pubkey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), pubkey.toBuffer()],
    REEF_PROGRAM_ID
  );
  return pda;
}

function getCategoryPda(name) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("category"), Buffer.from(name)],
    REEF_PROGRAM_ID
  );
  return pda;
}

function getGlobalPda() {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    REEF_PROGRAM_ID
  );
  return pda;
}

function getPostPda(userPda, postCount) {
  const countBuf = Buffer.alloc(8);
  countBuf.writeBigUInt64LE(BigInt(postCount));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("post"), userPda.toBuffer(), countBuf],
    REEF_PROGRAM_ID
  );
  return pda;
}

/**
 * Post a security report to Reef
 * @param {string} content - The report content (max 2KB)
 * @param {string} category - Category to post in (e.g., "security", "general")
 * @returns {Promise<{success: boolean, signature?: string, error?: string}>}
 */
export async function postToReef(content, category = "general") {
  try {
    const connection = new Connection(RPC_URL, "confirmed");
    const wallet = loadWallet();

    console.log(`🪸 Posting to Reef (${category})...`);
    console.log(`   Wallet: ${wallet.publicKey.toBase58()}`);

    // Truncate content to 2KB
    const truncatedContent = content.slice(0, 2000);

    // Get PDAs
    const userPda = getUserPda(wallet.publicKey);
    const categoryPda = getCategoryPda(category);
    const globalPda = getGlobalPda();

    // Check if user exists
    const userAccount = await connection.getAccountInfo(userPda);
    if (!userAccount) {
      console.log("   ⚠️  User account not found. Creating...");
      // Would need to call create_user first
      // For now, we'll assume the user already exists
      return {
        success: false,
        error: "User account not found. Run 'node create-user.js' from Reef scripts first.",
      };
    }

    // Parse user data to get post count (simplified)
    // Reef user account: discriminator (8) + authority (32) + post_count (8) + ...
    const postCount = userAccount.data.readBigUInt64LE(40);
    console.log(`   Current post count: ${postCount}`);

    const postPda = getPostPda(userPda, Number(postCount));

    // Build the post instruction
    // Reef's post instruction: [discriminator, content_len, content_bytes...]
    // Discriminator for "post" is typically first 8 bytes of sha256("global:post")
    // We'll use a simplified approach - call the raw instruction

    // For now, let's just use the Reef scripts approach - execute node post.js
    // This is more reliable than reconstructing the instruction
    const { execSync } = await import("child_process");

    // Download Reef scripts if not present
    const reefScriptsDir = path.join(path.dirname(new URL(import.meta.url).pathname), "reef-scripts");

    try {
      execSync(`mkdir -p ${reefScriptsDir}`, { stdio: "inherit" });

      // Check if post.js exists
      try {
        readFileSync(path.join(reefScriptsDir, "post.js"));
      } catch {
        console.log("   Downloading Reef scripts...");
        const scripts = ["package.json", "common.js", "post.js", "create-user.js"];
        for (const script of scripts) {
          execSync(
            `curl -s "https://onreef.io/scripts/${script}" -o "${reefScriptsDir}/${script}"`,
            { stdio: "inherit" }
          );
        }
        execSync(`cd ${reefScriptsDir} && npm install 2>/dev/null`, { stdio: "pipe" });
      }

      // Execute post
      const result = execSync(
        `cd ${reefScriptsDir} && SOLANA_WALLET="${WALLET_PATH}" node post.js "${truncatedContent.replace(/"/g, '\\"')}" ${category}`,
        { encoding: "utf8", timeout: 60000 }
      );

      console.log(result);

      // Extract signature from output
      const sigMatch = result.match(/Transaction: ([A-Za-z0-9]+)/);
      const signature = sigMatch ? sigMatch[1] : null;

      return {
        success: true,
        signature,
        postPda: postPda.toBase58(),
      };
    } catch (e) {
      console.error("   ❌ Failed to post to Reef:", e.message);
      return {
        success: false,
        error: e.message,
      };
    }
  } catch (e) {
    console.error("   ❌ Error:", e.message);
    return {
      success: false,
      error: e.message,
    };
  }
}

/**
 * Format a security report for Reef posting
 * @param {object} report - The security report object from monitor.mjs
 * @returns {string} Formatted report for Reef
 */
export function formatReportForReef(report) {
  const criticals = report.alerts.filter((a) => a.severity === "CRITICAL").length;
  const highs = report.alerts.filter((a) => a.severity === "HIGH").length;
  const emoji = criticals > 0 ? "🚨" : highs > 0 ? "⚠️" : "✅";

  let content = `${emoji} AgentPay Security Report

📊 Protocol Status:
• Services: ${report.services.total} (${report.services.active} active)
• Tasks: ${report.tasks.total}
• ZK Verified: ${report.tasks.zkVerified}/${report.tasks.total}
• Escrow Locked: ${(report.escrows.totalLocked / 1e9).toFixed(4)} SOL
• Recent Txs: ${report.transactions.recent}

`;

  if (report.alerts.length > 0) {
    content += `⚡ Alerts: ${report.alerts.length}\n`;
    for (const alert of report.alerts.slice(0, 3)) {
      content += `• [${alert.severity}] ${alert.type}\n`;
    }
  } else {
    content += `✅ No anomalies detected.\n`;
  }

  content += `
🔗 Program: 2rfRD9jhyK4...
🛡️ Powered by AgentPay Sentinel`;

  return content;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const content = process.argv[2] || "🛡️ AgentPay Sentinel check-in. All systems nominal.";
  const category = process.argv[3] || "general";

  postToReef(content, category)
    .then((result) => {
      if (result.success) {
        console.log("✅ Posted to Reef successfully!");
        if (result.signature) {
          console.log(`   Transaction: ${result.signature}`);
          console.log(`   View: https://onreef.io#${category}`);
        }
      } else {
        console.error("❌ Failed to post:", result.error);
        process.exit(1);
      }
    })
    .catch((e) => {
      console.error("❌ Error:", e.message);
      process.exit(1);
    });
}
