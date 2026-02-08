#!/usr/bin/env node

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { createHash, randomBytes } from "crypto";
import { Command } from "commander";
import web3 from "@solana/web3.js";
const { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = web3;
import anchor from "@coral-xyz/anchor";
const { AnchorProvider, Program, BN, Wallet } = anchor;

// ============================================================================
// Config
// ============================================================================

const PROGRAM_ID = new PublicKey(
  "2rfRD9jhyK4nwiWiDuixARYsmU3Euw2QMPjmSLHxxYpw"
);
const DEFAULT_RPC = "https://api.devnet.solana.com";
const IDL_PATH = new URL("./idl.json", import.meta.url);

function loadKeypair(path) {
  const resolved = path.replace("~", homedir());
  const raw = readFileSync(resolved, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

function getProgram(rpcUrl, keypairPath) {
  const connection = new Connection(rpcUrl, "confirmed");
  const keypair = loadKeypair(keypairPath);
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const idl = JSON.parse(readFileSync(IDL_PATH, "utf-8"));
  return { program: new Program(idl, provider), keypair, connection };
}

function padBytes(str, len) {
  const buf = Buffer.alloc(len);
  buf.write(str, "utf-8");
  return Array.from(buf);
}

function trimBytes(arr) {
  const buf = Buffer.from(arr);
  const end = buf.indexOf(0);
  return buf.subarray(0, end === -1 ? buf.length : end).toString("utf-8");
}

function lamportsToSol(lamports) {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4);
}

function solToLamports(sol) {
  return Math.round(parseFloat(sol) * LAMPORTS_PER_SOL);
}

// ============================================================================
// ZK proof helpers
// ============================================================================

function bigIntToBytes32BE(n) {
  const hex = n.toString(16).padStart(64, "0");
  return Buffer.from(hex, "hex");
}

function unstringifyProof(proof) {
  // Convert snarkjs proof format to groth16-solana byte format
  // proof_a: negate and convert to big-endian bytes
  // proof_b: convert to big-endian bytes
  // proof_c: convert to big-endian bytes

  const a = Buffer.alloc(64);
  const pi_a_x = BigInt(proof.pi_a[0]);
  const pi_a_y = BigInt(proof.pi_a[1]);
  // Negate proof_a (negate y coordinate on BN254)
  const P = BigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
  const neg_y = (P - pi_a_y) % P;
  bigIntToBytes32BE(pi_a_x).copy(a, 0);
  bigIntToBytes32BE(neg_y).copy(a, 32);

  const b = Buffer.alloc(128);
  // G2 point: proof_b[0] = [x_c1, x_c0], proof_b[1] = [y_c1, y_c0]
  // groth16-solana expects: [x_c0, x_c1, y_c0, y_c1] in big-endian
  bigIntToBytes32BE(BigInt(proof.pi_b[0][1])).copy(b, 0);
  bigIntToBytes32BE(BigInt(proof.pi_b[0][0])).copy(b, 32);
  bigIntToBytes32BE(BigInt(proof.pi_b[1][1])).copy(b, 64);
  bigIntToBytes32BE(BigInt(proof.pi_b[1][0])).copy(b, 96);

  const c = Buffer.alloc(64);
  bigIntToBytes32BE(BigInt(proof.pi_c[0])).copy(c, 0);
  bigIntToBytes32BE(BigInt(proof.pi_c[1])).copy(c, 32);

  return { a, b, c };
}

// ============================================================================
// PDA derivation
// ============================================================================

function findServicePda(provider, serviceId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("service"), provider.toBuffer(), Buffer.from(serviceId)],
    PROGRAM_ID
  );
}

function findTaskPda(requester, taskId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("task"), requester.toBuffer(), Buffer.from(taskId)],
    PROGRAM_ID
  );
}

// ============================================================================
// CLI
// ============================================================================

const cli = new Command();
cli
  .name("agentpay")
  .description("AgentPay: agent-to-agent payment protocol on Solana")
  .version("0.1.0")
  .option(
    "-k, --keypair <path>",
    "Path to Solana keypair",
    process.env.AGENTPAY_KEYPAIR || "~/.config/solana/id.json"
  )
  .option("-u, --url <rpc>", "Solana RPC URL", DEFAULT_RPC);

// ── register-service ────────────────────────────────────────────────────────

cli
  .command("register-service")
  .description("Register a service on-chain with a description and price")
  .requiredOption("-d, --description <text>", "Service description (max 128 chars)")
  .requiredOption("-p, --price <sol>", "Price per task in SOL")
  .option("--min-reputation <n>", "Minimum reputation score required (0 = no minimum)", "0")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );
    const serviceId = randomBytes(16);
    const [serviceListingPda] = findServicePda(keypair.publicKey, serviceId);

    const tx = await program.methods
      .registerService(
        Array.from(serviceId),
        padBytes(opts.description, 128),
        new BN(solToLamports(opts.price)),
        new BN(parseInt(opts.minReputation))
      )
      .accounts({
        provider: keypair.publicKey,
        serviceListing: serviceListingPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        serviceId: Buffer.from(serviceId).toString("hex"),
        servicePda: serviceListingPda.toBase58(),
        description: opts.description,
        priceSol: opts.price,
        tx,
      })
    );
  });

// ── list-services ───────────────────────────────────────────────────────────

// Account sizes for filtering (to skip incompatible legacy accounts)
const SERVICE_LISTING_SIZE = 218;
const TASK_REQUEST_SIZE = 435;

cli
  .command("list-services")
  .description("List all registered services (optionally filter by provider)")
  .option("--provider <pubkey>", "Filter by provider wallet")
  .action(async (opts) => {
    const { program, connection } = getProgram(cli.opts().url, cli.opts().keypair);

    // Use dataSize filter to skip incompatible legacy accounts
    const filters = [{ dataSize: SERVICE_LISTING_SIZE }];
    if (opts.provider) {
      filters.push({
        memcmp: {
          offset: 8, // after discriminator
          bytes: new PublicKey(opts.provider).toBase58(),
        },
      });
    }

    const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });
    const services = [];

    for (const { pubkey, account } of rawAccounts) {
      try {
        const decoded = program.coder.accounts.decode("serviceListing", account.data);
        services.push({
          pda: pubkey.toBase58(),
          provider: decoded.provider.toBase58(),
          serviceId: Buffer.from(decoded.serviceId).toString("hex"),
          description: trimBytes(decoded.description),
          priceSol: lamportsToSol(decoded.priceLamports),
          isActive: decoded.isActive,
          tasksCompleted: decoded.tasksCompleted.toNumber(),
        });
      } catch {
        // Skip incompatible accounts
      }
    }

    console.log(JSON.stringify({ status: "ok", count: services.length, services }));
  });

// ── REKT Shield integration ─────────────────────────────────────────────────

const REKT_SHIELD_API = "https://web-production-c5ac4.up.railway.app/api/scan";

async function scanProviderRisk(providerPubkey) {
  try {
    const response = await fetch(`${REKT_SHIELD_API}/${providerPubkey}`);
    if (!response.ok) {
      console.error(`⚠️  REKT Shield API returned ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error(`⚠️  Could not reach REKT Shield: ${e.message}`);
    return null;
  }
}

// ── create-task ─────────────────────────────────────────────────────────────

cli
  .command("create-task")
  .description("Create a task and lock payment in escrow")
  .requiredOption("--service-pda <pda>", "Service listing PDA address")
  .requiredOption("-d, --description <text>", "Task description (max 256 chars)")
  .option("--deadline-minutes <min>", "Deadline in minutes from now", "60")
  .option("--scan-provider", "Scan provider wallet for risk using REKT Shield before creating task")
  .option("--risk-threshold <score>", "Max acceptable risk score (0-100, default 70)", "70")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    const serviceListingPda = new PublicKey(opts.servicePda);

    // Fetch service to get provider address
    const serviceAccount = await program.account.serviceListing.fetch(serviceListingPda);
    const providerPubkey = serviceAccount.provider.toBase58();

    // REKT Shield integration: scan provider before locking escrow
    if (opts.scanProvider) {
      console.error(`🔍 Scanning provider ${providerPubkey} with REKT Shield...`);
      const riskData = await scanProviderRisk(providerPubkey);

      if (riskData) {
        const riskScore = riskData.score || riskData.riskScore || 0;
        const threshold = parseInt(opts.riskThreshold);

        if (riskScore > threshold) {
          console.error(`🚨 Provider risk score: ${riskScore}/100 — exceeds threshold of ${threshold}`);
          console.error(`   Reason: ${riskData.reason || riskData.summary || 'High risk detected'}`);
          console.error(`   Aborting task creation to protect your funds.`);
          process.exit(1);
        }

        console.error(`✅ Provider risk score: ${riskScore}/100 — safe to proceed`);
      } else {
        console.error(`⚠️  Could not verify provider risk. Proceeding with caution.`);
      }
    }

    const taskId = randomBytes(16);
    const [taskRequestPda] = findTaskPda(keypair.publicKey, taskId);
    const deadlineMinutes = parseInt(opts.deadlineMinutes);
    const deadline = Math.floor(Date.now() / 1000) + deadlineMinutes * 60;

    const tx = await program.methods
      .createTask(
        Array.from(taskId),
        padBytes(opts.description, 256),
        new BN(deadline)
      )
      .accounts({
        requester: keypair.publicKey,
        serviceListing: serviceListingPda,
        taskRequest: taskRequestPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        taskId: Buffer.from(taskId).toString("hex"),
        taskPda: taskRequestPda.toBase58(),
        servicePda: opts.servicePda,
        provider: providerPubkey,
        deadlineMinutes,
        tx,
      })
    );
  });

// ── list-tasks ──────────────────────────────────────────────────────────────

cli
  .command("list-tasks")
  .description("List tasks (filter by requester or provider)")
  .option("--requester <pubkey>", "Filter by requester wallet")
  .option("--provider <pubkey>", "Filter by provider wallet")
  .option("--status <status>", "Filter by status: open, submitted, completed, disputed, expired")
  .action(async (opts) => {
    const { program, connection } = getProgram(cli.opts().url, cli.opts().keypair);

    // Use dataSize filter to skip incompatible legacy accounts
    const filters = [{ dataSize: TASK_REQUEST_SIZE }];
    if (opts.requester) {
      filters.push({
        memcmp: { offset: 8, bytes: new PublicKey(opts.requester).toBase58() },
      });
    }
    if (opts.provider) {
      filters.push({
        memcmp: { offset: 40, bytes: new PublicKey(opts.provider).toBase58() },
      });
    }

    const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, { filters });
    let tasks = [];

    for (const { pubkey, account } of rawAccounts) {
      try {
        const decoded = program.coder.accounts.decode("taskRequest", account.data);
        const statusKey = Object.keys(decoded.status)[0];
        tasks.push({
          pda: pubkey.toBase58(),
          taskId: Buffer.from(decoded.taskId).toString("hex"),
          requester: decoded.requester.toBase58(),
          provider: decoded.provider.toBase58(),
          description: trimBytes(decoded.description),
          amountSol: lamportsToSol(decoded.amountLamports),
          status: statusKey,
          resultHash:
            statusKey === "submitted" || statusKey === "completed"
              ? Buffer.from(decoded.resultHash).toString("hex")
              : null,
          deadline: new Date(decoded.deadline.toNumber() * 1000).toISOString(),
          zkVerified: decoded.zkVerified ?? false,
        });
      } catch {
        // Skip incompatible accounts
      }
    }

    if (opts.status) {
      tasks = tasks.filter((t) => t.status === opts.status);
    }

    console.log(JSON.stringify({ status: "ok", count: tasks.length, tasks }));
  });

// ── submit-result ───────────────────────────────────────────────────────────

cli
  .command("submit-result")
  .description("Submit a result hash for a task (as provider)")
  .requiredOption("--task-pda <pda>", "Task request PDA address")
  .requiredOption("-r, --result <text>", "Result text (will be SHA256 hashed)")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    const resultHash = createHash("sha256").update(opts.result).digest();

    const tx = await program.methods
      .submitResult(Array.from(resultHash))
      .accounts({
        provider: keypair.publicKey,
        taskRequest: new PublicKey(opts.taskPda),
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        taskPda: opts.taskPda,
        resultHash: resultHash.toString("hex"),
        tx,
      })
    );
  });

// ── submit-result-zk ────────────────────────────────────────────────────────

cli
  .command("submit-result-zk")
  .description("Submit a ZK-verified result for a task (Groth16 proof verified on-chain)")
  .requiredOption("--task-pda <pda>", "Task request PDA address")
  .requiredOption("-r, --result <text>", "Result text (will be Poseidon hashed & ZK proved)")
  .option("--circuits-dir <path>", "Path to compiled circuits directory", new URL("../circuits", import.meta.url).pathname)
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    // Dynamically import snarkjs and circomlibjs
    const snarkjs = await import("snarkjs");
    const { buildPoseidon } = await import("circomlibjs");

    // Compute Poseidon hash of the result (as field element)
    const poseidon = await buildPoseidon();
    // Convert result text to a field element (use first 31 bytes of SHA256 to stay in field)
    const resultSha = createHash("sha256").update(opts.result).digest();
    const resultField = BigInt("0x" + resultSha.subarray(0, 31).toString("hex"));
    const poseidonHash = poseidon.F.toString(poseidon([resultField]));

    console.error("Generating ZK proof...");

    // Generate Groth16 proof
    const circuitsDir = opts.circuitsDir;
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { result: resultField.toString(), expectedHash: poseidonHash },
      `${circuitsDir}/task_verify_js/task_verify.wasm`,
      `${circuitsDir}/task_verify.zkey`
    );

    console.error("ZK proof generated. Submitting to Solana...");

    // Convert proof to byte arrays for the on-chain verifier
    // groth16-solana expects: proof_a negated big-endian, proof_b big-endian, proof_c big-endian
    const proofParsed = unstringifyProof(proof);

    // Convert public signal (Poseidon hash) to 32-byte big-endian
    const hashBigInt = BigInt(publicSignals[0]);
    const resultHashBytes = bigIntToBytes32BE(hashBigInt);

    const tx = await program.methods
      .submitResultZk(
        Array.from(proofParsed.a),
        Array.from(proofParsed.b),
        Array.from(proofParsed.c),
        Array.from(resultHashBytes)
      )
      .accounts({
        provider: keypair.publicKey,
        taskRequest: new PublicKey(opts.taskPda),
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        taskPda: opts.taskPda,
        resultHash: Buffer.from(resultHashBytes).toString("hex"),
        zkVerified: true,
        tx,
      })
    );
  });

// ── accept-result ───────────────────────────────────────────────────────────

cli
  .command("accept-result")
  .description("Accept a submitted result and release escrow to provider")
  .requiredOption("--task-pda <pda>", "Task request PDA address")
  .requiredOption("--provider <pubkey>", "Provider wallet pubkey")
  .requiredOption("--service-pda <pda>", "Service listing PDA address")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    const tx = await program.methods
      .acceptResult()
      .accounts({
        requester: keypair.publicKey,
        taskRequest: new PublicKey(opts.taskPda),
        provider: new PublicKey(opts.provider),
        serviceListing: new PublicKey(opts.servicePda),
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        taskPda: opts.taskPda,
        action: "accepted",
        tx,
      })
    );
  });

// ── dispute-task ────────────────────────────────────────────────────────────

cli
  .command("dispute-task")
  .description("Dispute a submitted result and get refund")
  .requiredOption("--task-pda <pda>", "Task request PDA address")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    const tx = await program.methods
      .disputeTask()
      .accounts({
        requester: keypair.publicKey,
        taskRequest: new PublicKey(opts.taskPda),
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        taskPda: opts.taskPda,
        action: "disputed",
        tx,
      })
    );
  });

// ── expire-task ─────────────────────────────────────────────────────────────

cli
  .command("expire-task")
  .description("Expire a task past its deadline and refund requester")
  .requiredOption("--task-pda <pda>", "Task request PDA address")
  .requiredOption("--requester <pubkey>", "Requester wallet to refund")
  .action(async (opts) => {
    const { program } = getProgram(cli.opts().url, cli.opts().keypair);

    const tx = await program.methods
      .expireTask()
      .accounts({
        requester: new PublicKey(opts.requester),
        taskRequest: new PublicKey(opts.taskPda),
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        taskPda: opts.taskPda,
        action: "expired",
        tx,
      })
    );
  });

// ── deactivate-service ──────────────────────────────────────────────────────

cli
  .command("deactivate-service")
  .description("Deactivate a service listing")
  .requiredOption("--service-pda <pda>", "Service listing PDA address")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    const tx = await program.methods
      .deactivateService()
      .accounts({
        provider: keypair.publicKey,
        serviceListing: new PublicKey(opts.servicePda),
      })
      .rpc();

    console.log(
      JSON.stringify({
        status: "ok",
        servicePda: opts.servicePda,
        action: "deactivated",
        tx,
      })
    );
  });

// ── scan-wallet ─────────────────────────────────────────────────────────────

cli
  .command("scan-wallet")
  .description("Scan a wallet for risk using REKT Shield (by @Youth)")
  .requiredOption("-w, --wallet <pubkey>", "Wallet address to scan")
  .action(async (opts) => {
    console.error(`🔍 Scanning wallet ${opts.wallet} with REKT Shield...`);
    const riskData = await scanProviderRisk(opts.wallet);

    if (!riskData) {
      console.log(JSON.stringify({
        status: "error",
        message: "Could not reach REKT Shield API",
      }));
      return;
    }

    const riskScore = riskData.score || riskData.riskScore || 0;
    const emoji = riskScore <= 30 ? "✅" : riskScore <= 70 ? "⚠️" : "🚨";

    console.log(JSON.stringify({
      status: "ok",
      wallet: opts.wallet,
      riskScore,
      riskLevel: riskScore <= 30 ? "LOW" : riskScore <= 70 ? "MEDIUM" : "HIGH",
      details: riskData,
      poweredBy: "REKT Shield (@Youth)",
    }));
  });

// ── balance ─────────────────────────────────────────────────────────────────

cli
  .command("balance")
  .description("Show wallet SOL balance")
  .action(async () => {
    const { keypair, connection } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(
      JSON.stringify({
        status: "ok",
        wallet: keypair.publicKey.toBase58(),
        balanceSol: lamportsToSol(balance),
      })
    );
  });

// ── wallet-info ─────────────────────────────────────────────────────────────

cli
  .command("wallet-info")
  .description("Show wallet public key")
  .action(async () => {
    const { keypair } = getProgram(cli.opts().url, cli.opts().keypair);
    console.log(
      JSON.stringify({
        status: "ok",
        wallet: keypair.publicKey.toBase58(),
      })
    );
  });

cli.parse();
