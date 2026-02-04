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
    "~/.config/solana/id.json"
  )
  .option("-u, --url <rpc>", "Solana RPC URL", DEFAULT_RPC);

// ── register-service ────────────────────────────────────────────────────────

cli
  .command("register-service")
  .description("Register a service on-chain with a description and price")
  .requiredOption("-d, --description <text>", "Service description (max 128 chars)")
  .requiredOption("-p, --price <sol>", "Price per task in SOL")
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
        new BN(solToLamports(opts.price))
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

cli
  .command("list-services")
  .description("List all registered services (optionally filter by provider)")
  .option("--provider <pubkey>", "Filter by provider wallet")
  .action(async (opts) => {
    const { program } = getProgram(cli.opts().url, cli.opts().keypair);

    const filters = [];
    if (opts.provider) {
      filters.push({
        memcmp: {
          offset: 8, // after discriminator
          bytes: new PublicKey(opts.provider).toBase58(),
        },
      });
    }

    const accounts = await program.account.serviceListing.all(filters);
    const services = accounts.map((a) => ({
      pda: a.publicKey.toBase58(),
      provider: a.account.provider.toBase58(),
      serviceId: Buffer.from(a.account.serviceId).toString("hex"),
      description: trimBytes(a.account.description),
      priceSol: lamportsToSol(a.account.priceLamports),
      isActive: a.account.isActive,
      tasksCompleted: a.account.tasksCompleted.toNumber(),
    }));

    console.log(JSON.stringify({ status: "ok", count: services.length, services }));
  });

// ── create-task ─────────────────────────────────────────────────────────────

cli
  .command("create-task")
  .description("Create a task and lock payment in escrow")
  .requiredOption("--service-pda <pda>", "Service listing PDA address")
  .requiredOption("-d, --description <text>", "Task description (max 256 chars)")
  .option("--deadline-minutes <min>", "Deadline in minutes from now", "60")
  .action(async (opts) => {
    const { program, keypair } = getProgram(
      cli.opts().url,
      cli.opts().keypair
    );

    const taskId = randomBytes(16);
    const [taskRequestPda] = findTaskPda(keypair.publicKey, taskId);
    const serviceListingPda = new PublicKey(opts.servicePda);
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
    const { program } = getProgram(cli.opts().url, cli.opts().keypair);

    const filters = [];
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

    const accounts = await program.account.taskRequest.all(filters);
    let tasks = accounts.map((a) => {
      const statusKey = Object.keys(a.account.status)[0];
      return {
        pda: a.publicKey.toBase58(),
        taskId: Buffer.from(a.account.taskId).toString("hex"),
        requester: a.account.requester.toBase58(),
        provider: a.account.provider.toBase58(),
        description: trimBytes(a.account.description),
        amountSol: lamportsToSol(a.account.amountLamports),
        status: statusKey,
        resultHash:
          statusKey === "submitted" || statusKey === "completed"
            ? Buffer.from(a.account.resultHash).toString("hex")
            : null,
        deadline: new Date(a.account.deadline.toNumber() * 1000).toISOString(),
      };
    });

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
