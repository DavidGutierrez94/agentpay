import { BN } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/constants";
import { findTaskPda } from "@/lib/pda";
import { getConnection, getProgram, getReadonlyProgram } from "@/lib/program";
import { lamportsToSol, padBytes, trimBytes } from "@/lib/utils";

// Account sizes for filtering (to skip incompatible legacy accounts)
const SERVICE_LISTING_SIZE = 218;
const TASK_REQUEST_SIZE = 435;

// REKT Shield API
const REKT_SHIELD_API = "https://web-production-c5ac4.up.railway.app/api/scan";

export interface CommandResult {
  output: string;
  data?: unknown;
  error?: boolean;
}

type CommandHandler = (
  args: string[],
  wallet: AnchorWallet | undefined,
  publicKey: PublicKey | null,
) => Promise<CommandResult>;

function parseArgs(raw: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].startsWith("--")) {
      const key = raw[i].replace(/^--/, "");
      map[key] = raw[i + 1] ?? "";
      i++;
    } else if (raw[i].startsWith("-") && raw[i].length === 2) {
      const key = raw[i][1];
      map[key] = raw[i + 1] ?? "";
      i++;
    } else if (!raw[i].startsWith("-")) {
      // Positional argument
      map[`_${Object.keys(map).filter((k) => k.startsWith("_")).length}`] = raw[i];
    }
  }
  return map;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const commands: Record<string, CommandHandler> = {
  help: async () => ({
    output: `
╔═══════════════════════════════════════════════════════════════╗
║                    AgentPay Terminal v0.2                     ║
╚═══════════════════════════════════════════════════════════════╝

📊 QUICK STATS & MONITORING
  stats                   Protocol overview (services, tasks, escrow)
  health                  Check RPC and program health
  recent                  Show recent transactions (last 10)
  top-providers           Leaderboard of providers by tasks completed

🔍 WALLET UTILITIES
  balance                 Show your wallet balance
  scan <wallet>           Scan any wallet for risk (REKT Shield)
  airdrop                 Request devnet SOL airdrop
  history                 Your recent AgentPay transactions

⚡ QUICK ACTIONS
  my-tasks                Show tasks you're involved in
  my-services             Show your registered services
  open-tasks              List all open tasks available
  hire <service#>         Quick hire a service (auto-fills details)

📋 FULL COMMANDS
  list-services           List all services
  list-tasks              List all tasks
  create-task             Create task (--service-pda <pda> -d <desc>)
  submit-result           Submit result (--task-pda <pda> -r <result>)
  accept-result           Accept and pay (--task-pda <pda>)

💳 x402 PAYMENTS
  x402-services           List x402-enabled services
  x402-info <id>          Get x402 service details

Type a command to get started. Example: stats
`,
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK STATS & MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  stats: async () => {
    const connection = getConnection();
    const program = getReadonlyProgram();

    const [serviceAccounts, taskAccounts] = await Promise.all([
      connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: SERVICE_LISTING_SIZE }] }),
      connection.getProgramAccounts(PROGRAM_ID, { filters: [{ dataSize: TASK_REQUEST_SIZE }] }),
    ]);

    let activeServices = 0;
    let totalTasksCompleted = 0;
    const tasksByStatus: Record<string, number> = {
      open: 0,
      submitted: 0,
      completed: 0,
      disputed: 0,
      expired: 0,
    };
    let escrowLocked = 0;

    for (const { account } of serviceAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("serviceListing", account.data);
        if (decoded.isActive) activeServices++;
        totalTasksCompleted += decoded.tasksCompleted.toNumber();
      } catch {
        /* skip */
      }
    }

    for (const { account } of taskAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);
        const status = Object.keys(decoded.status)[0];
        tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
        if (status === "open" || status === "submitted") {
          escrowLocked += decoded.amountLamports.toNumber();
        }
      } catch {
        /* skip */
      }
    }

    const output = `
╔═══════════════════════════════════════════════════════════════╗
║                    📊 Protocol Statistics                     ║
╠═══════════════════════════════════════════════════════════════╣
║  Services: ${String(serviceAccounts.length).padEnd(8)} Active: ${String(activeServices).padEnd(25)}║
║  Tasks Completed: ${String(totalTasksCompleted).padEnd(41)}║
╠═══════════════════════════════════════════════════════════════╣
║  📋 Tasks by Status                                           ║
║    Open: ${String(tasksByStatus.open).padEnd(10)} Submitted: ${String(tasksByStatus.submitted).padEnd(22)}║
║    Completed: ${String(tasksByStatus.completed).padEnd(6)} Disputed: ${String(tasksByStatus.disputed).padEnd(23)}║
╠═══════════════════════════════════════════════════════════════╣
║  💰 Escrow Locked: ${(escrowLocked / LAMPORTS_PER_SOL).toFixed(4)} SOL${" ".repeat(30)}║
╚═══════════════════════════════════════════════════════════════╝`;

    return {
      output,
      data: { services: serviceAccounts.length, activeServices, tasksByStatus, escrowLocked },
    };
  },

  health: async () => {
    const connection = getConnection();
    const start = Date.now();

    try {
      const [slot, blockHeight, version] = await Promise.all([
        connection.getSlot(),
        connection.getBlockHeight(),
        connection.getVersion(),
      ]);
      const latency = Date.now() - start;

      const programInfo = await connection.getAccountInfo(PROGRAM_ID);
      const programStatus = programInfo ? "✅ Deployed" : "❌ Not found";

      const output = `
╔═══════════════════════════════════════════════════════════════╗
║                      🏥 Health Check                          ║
╠═══════════════════════════════════════════════════════════════╣
║  RPC: Solana Devnet                                           ║
║  Latency: ${String(`${latency}ms`).padEnd(50)}║
║  Slot: ${String(slot).padEnd(53)}║
║  Block Height: ${String(blockHeight).padEnd(45)}║
║  Version: ${String(version["solana-core"]).padEnd(50)}║
╠═══════════════════════════════════════════════════════════════╣
║  Program: ${shortAddr(PROGRAM_ID.toBase58()).padEnd(50)}║
║  Status: ${programStatus.padEnd(51)}║
╚═══════════════════════════════════════════════════════════════╝`;

      return { output, data: { latency, slot, blockHeight, programStatus } };
    } catch (err) {
      return {
        output: `❌ Health check failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        error: true,
      };
    }
  },

  recent: async () => {
    const connection = getConnection();
    const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 10 });

    if (signatures.length === 0) {
      return { output: "No recent transactions found." };
    }

    let output = `
╔═══════════════════════════════════════════════════════════════╗
║                    📜 Recent Transactions                     ║
╠═══════════════════════════════════════════════════════════════╣`;

    for (const sig of signatures) {
      const time = sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleTimeString() : "???";
      const status = sig.err ? "❌" : "✅";
      output += `\n║  ${status} ${shortAddr(sig.signature)} @ ${time.padEnd(30)}║`;
    }
    output += `\n╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { count: signatures.length, signatures } };
  },

  "top-providers": async () => {
    const connection = getConnection();
    const program = getReadonlyProgram();
    const serviceAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: SERVICE_LISTING_SIZE }],
    });

    const providerStats = new Map<string, { tasks: number; services: number }>();

    for (const { account } of serviceAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("serviceListing", account.data);
        const provider = decoded.provider.toBase58();
        const existing = providerStats.get(provider) || { tasks: 0, services: 0 };
        providerStats.set(provider, {
          tasks: existing.tasks + decoded.tasksCompleted.toNumber(),
          services: existing.services + 1,
        });
      } catch {
        /* skip */
      }
    }

    const sorted = Array.from(providerStats.entries())
      .sort((a, b) => b[1].tasks - a[1].tasks)
      .slice(0, 5);

    let output = `
╔═══════════════════════════════════════════════════════════════╗
║                    🏆 Top Providers                           ║
╠═══════════════════════════════════════════════════════════════╣`;

    sorted.forEach(([addr, stats], i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
      output += `\n║  ${medal} ${shortAddr(addr)} - ${stats.tasks} tasks (${stats.services} services)${" ".repeat(20)}║`;
    });

    if (sorted.length === 0) {
      output += `\n║  No providers yet. Be the first!${" ".repeat(27)}║`;
    }
    output += `\n╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { providers: sorted } };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WALLET UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  balance: async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "❌ Connect wallet first", error: true };
    const connection = getConnection();
    const bal = await connection.getBalance(publicKey);
    const solBalance = (bal / LAMPORTS_PER_SOL).toFixed(4);

    const output = `
╔═══════════════════════════════════════════════════════════════╗
║                      💰 Wallet Balance                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Address: ${shortAddr(publicKey.toBase58()).padEnd(50)}║
║  Balance: ${(`${solBalance} SOL`).padEnd(50)}║
║  Network: Devnet${" ".repeat(44)}║
╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { wallet: publicKey.toBase58(), balanceSol: solBalance } };
  },

  scan: async (args) => {
    const wallet = args[0] || parseArgs(args)._0;
    if (!wallet) return { output: "Usage: scan <wallet_address>", error: true };

    try {
      new PublicKey(wallet); // Validate
    } catch {
      return { output: "❌ Invalid wallet address", error: true };
    }

    try {
      const response = await fetch(`${REKT_SHIELD_API}/${wallet}`);
      if (!response.ok) {
        return { output: `⚠️ REKT Shield API returned ${response.status}`, error: true };
      }
      const riskData = await response.json();
      const score = riskData.score || riskData.riskScore || 0;
      const emoji = score <= 30 ? "✅" : score <= 70 ? "⚠️" : "🚨";
      const level = score <= 30 ? "LOW" : score <= 70 ? "MEDIUM" : "HIGH";

      const output = `
╔═══════════════════════════════════════════════════════════════╗
║                    🔍 REKT Shield Scan                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Wallet: ${shortAddr(wallet).padEnd(51)}║
║  Risk Score: ${(`${emoji} ${score}/100`).padEnd(47)}║
║  Risk Level: ${level.padEnd(47)}║
╠═══════════════════════════════════════════════════════════════╣
║  Powered by REKT Shield (@Youth)                              ║
╚═══════════════════════════════════════════════════════════════╝`;

      return { output, data: { wallet, score, level, details: riskData } };
    } catch (err) {
      return {
        output: `❌ Could not reach REKT Shield: ${err instanceof Error ? err.message : "Unknown"}`,
        error: true,
      };
    }
  },

  airdrop: async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "❌ Connect wallet first", error: true };
    const connection = getConnection();

    try {
      const sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      const newBal = await connection.getBalance(publicKey);

      return {
        output: `✅ Airdrop successful! +1 SOL\n   New balance: ${(newBal / LAMPORTS_PER_SOL).toFixed(4)} SOL\n   Tx: ${shortAddr(sig)}`,
        data: { signature: sig, newBalance: newBal / LAMPORTS_PER_SOL },
      };
    } catch (err) {
      return {
        output: `❌ Airdrop failed: ${err instanceof Error ? err.message : "Rate limited?"}`,
        error: true,
      };
    }
  },

  history: async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "❌ Connect wallet first", error: true };
    const connection = getConnection();
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });

    if (signatures.length === 0) {
      return { output: "No transaction history found." };
    }

    let output = `
╔═══════════════════════════════════════════════════════════════╗
║                    📜 Your Transaction History                ║
╠═══════════════════════════════════════════════════════════════╣`;

    for (const sig of signatures) {
      const time = sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleTimeString() : "???";
      const status = sig.err ? "❌" : "✅";
      output += `\n║  ${status} ${shortAddr(sig.signature)} @ ${time.padEnd(30)}║`;
    }
    output += `\n╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { count: signatures.length } };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  "my-tasks": async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "❌ Connect wallet first", error: true };
    const connection = getConnection();
    const program = getReadonlyProgram();
    const taskAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: TASK_REQUEST_SIZE }],
    });

    const myTasks: { pda: string; role: string; status: string; amount: string; desc: string }[] =
      [];

    for (const { pubkey, account } of taskAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);
        const requester = decoded.requester.toBase58();
        const provider = decoded.provider.toBase58();
        const pk = publicKey.toBase58();

        if (requester === pk || provider === pk) {
          myTasks.push({
            pda: pubkey.toBase58(),
            role: requester === pk ? "Requester" : "Provider",
            status: Object.keys(decoded.status)[0],
            amount: lamportsToSol(decoded.amountLamports),
            desc: trimBytes(decoded.description).slice(0, 30),
          });
        }
      } catch {
        /* skip */
      }
    }

    if (myTasks.length === 0) {
      return { output: "No tasks found for your wallet. Try 'open-tasks' to see available work!" };
    }

    let output = `
╔═══════════════════════════════════════════════════════════════╗
║                       📋 My Tasks                             ║
╠═══════════════════════════════════════════════════════════════╣`;

    myTasks.forEach((t, i) => {
      const statusEmoji =
        t.status === "open"
          ? "🟡"
          : t.status === "completed"
            ? "✅"
            : t.status === "submitted"
              ? "📤"
              : "❓";
      output += `\n║  ${i + 1}. [${t.role}] ${statusEmoji} ${t.status.padEnd(10)} ${t.amount} SOL${" ".repeat(15)}║`;
      output += `\n║     ${t.desc.padEnd(55)}║`;
    });
    output += `\n╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { tasks: myTasks } };
  },

  "my-services": async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "❌ Connect wallet first", error: true };
    const connection = getConnection();
    const program = getReadonlyProgram();
    const serviceAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        { dataSize: SERVICE_LISTING_SIZE },
        { memcmp: { offset: 8, bytes: publicKey.toBase58() } },
      ],
    });

    if (serviceAccounts.length === 0) {
      return {
        output:
          'You haven\'t registered any services yet.\nUse the CLI: agentpay register-service -d "Your service" -p 0.01',
      };
    }

    let output = `
╔═══════════════════════════════════════════════════════════════╗
║                      🏪 My Services                           ║
╠═══════════════════════════════════════════════════════════════╣`;

    for (const { pubkey, account } of serviceAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("serviceListing", account.data);
        const status = decoded.isActive ? "✅ Active" : "⏸️ Inactive";
        output += `\n║  ${status} - ${trimBytes(decoded.description).slice(0, 40).padEnd(40)}║`;
        output += `\n║    Price: ${lamportsToSol(decoded.priceLamports)} SOL | Completed: ${decoded.tasksCompleted.toNumber()} tasks${" ".repeat(15)}║`;
        output += `\n║    PDA: ${shortAddr(pubkey.toBase58()).padEnd(51)}║`;
      } catch {
        /* skip */
      }
    }
    output += `\n╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { count: serviceAccounts.length } };
  },

  "open-tasks": async () => {
    const connection = getConnection();
    const program = getReadonlyProgram();
    const taskAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: TASK_REQUEST_SIZE }],
    });

    const openTasks: { pda: string; amount: string; desc: string; deadline: string }[] = [];

    for (const { pubkey, account } of taskAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);
        if (Object.keys(decoded.status)[0] === "open") {
          openTasks.push({
            pda: pubkey.toBase58(),
            amount: lamportsToSol(decoded.amountLamports),
            desc: trimBytes(decoded.description).slice(0, 40),
            deadline: new Date(decoded.deadline.toNumber() * 1000).toLocaleString(),
          });
        }
      } catch {
        /* skip */
      }
    }

    if (openTasks.length === 0) {
      return { output: "🎉 No open tasks right now. All caught up!" };
    }

    let output = `
╔═══════════════════════════════════════════════════════════════╗
║                     🟡 Open Tasks                             ║
╠═══════════════════════════════════════════════════════════════╣`;

    openTasks.forEach((t, i) => {
      output += `\n║  ${i + 1}. ${t.amount} SOL - ${t.desc.padEnd(40)}║`;
      output += `\n║     Deadline: ${t.deadline.padEnd(45)}║`;
      output += `\n║     PDA: ${shortAddr(t.pda).padEnd(50)}║`;
    });
    output += `\n╚═══════════════════════════════════════════════════════════════╝`;

    return { output, data: { tasks: openTasks } };
  },

  hire: async (args, wallet, publicKey) => {
    if (!wallet || !publicKey) return { output: "❌ Connect wallet first", error: true };

    const serviceNum = parseInt(args[0] || parseArgs(args)._0 || "1", 10);

    // Fetch services
    const connection = getConnection();
    const program = getReadonlyProgram();
    const serviceAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: SERVICE_LISTING_SIZE }],
    });

    const services: { pda: PublicKey; desc: string; price: number }[] = [];
    for (const { pubkey, account } of serviceAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("serviceListing", account.data);
        if (decoded.isActive) {
          services.push({
            pda: pubkey,
            desc: trimBytes(decoded.description),
            price: decoded.priceLamports.toNumber(),
          });
        }
      } catch {
        /* skip */
      }
    }

    if (services.length === 0) {
      return { output: "No active services available." };
    }

    if (serviceNum < 1 || serviceNum > services.length) {
      let output = `Select a service (1-${services.length}):\n`;
      services.forEach((s, i) => {
        output += `  ${i + 1}. ${s.desc.slice(0, 50)} (${lamportsToSol(s.price)} SOL)\n`;
      });
      output += `\nUsage: hire <number>`;
      return { output };
    }

    const selected = services[serviceNum - 1];

    // Create task with auto-generated description
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txProgram = getProgram(wallet) as any;
    const taskId = crypto.getRandomValues(new Uint8Array(16));
    const [taskRequestPda] = findTaskPda(publicKey, taskId);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    const desc = `Quick task via terminal @ ${new Date().toISOString()}`;

    try {
      const tx = await txProgram.methods
        .createTask(Array.from(taskId), padBytes(desc, 256), new BN(deadline))
        .accounts({
          requester: publicKey,
          serviceListing: selected.pda,
          taskRequest: taskRequestPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        output: `✅ Task created!\n   Service: ${selected.desc.slice(0, 40)}\n   Amount: ${lamportsToSol(selected.price)} SOL\n   Task PDA: ${shortAddr(taskRequestPda.toBase58())}\n   Tx: ${shortAddr(tx)}`,
        data: { taskPda: taskRequestPda.toBase58(), tx },
      };
    } catch (err) {
      return {
        output: `❌ Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        error: true,
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL COMMANDS (kept for power users)
  // ═══════════════════════════════════════════════════════════════════════════

  "list-services": async () => {
    const connection = getConnection();
    const program = getReadonlyProgram();
    const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: SERVICE_LISTING_SIZE }],
    });

    const services: unknown[] = [];
    for (const { pubkey, account } of rawAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("serviceListing", account.data);
        services.push({
          pda: pubkey.toBase58(),
          provider: decoded.provider.toBase58(),
          description: trimBytes(decoded.description),
          priceSol: lamportsToSol(decoded.priceLamports),
          isActive: decoded.isActive,
          tasksCompleted: decoded.tasksCompleted.toNumber(),
        });
      } catch {
        /* skip */
      }
    }

    const data = { status: "ok", count: services.length, services };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "list-tasks": async () => {
    const connection = getConnection();
    const program = getReadonlyProgram();
    const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: TASK_REQUEST_SIZE }],
    });

    const tasks: unknown[] = [];
    for (const { pubkey, account } of rawAccounts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);
        const statusKey = Object.keys(decoded.status)[0];
        tasks.push({
          pda: pubkey.toBase58(),
          requester: decoded.requester.toBase58(),
          provider: decoded.provider.toBase58(),
          description: trimBytes(decoded.description),
          amountSol: lamportsToSol(decoded.amountLamports),
          status: statusKey,
          deadline: new Date(decoded.deadline.toNumber() * 1000).toISOString(),
          zkVerified: decoded.zkVerified ?? false,
        });
      } catch {
        /* skip */
      }
    }

    const data = { status: "ok", count: tasks.length, tasks };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "create-task": async (args, wallet, publicKey) => {
    if (!wallet || !publicKey) return { output: "❌ Connect wallet first", error: true };
    const opts = parseArgs(args);
    if (!opts["service-pda"]) return { output: "Error: --service-pda required", error: true };
    if (!opts.d) return { output: "Error: -d <description> required", error: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = getProgram(wallet) as any;
    const taskId = crypto.getRandomValues(new Uint8Array(16));
    const [taskRequestPda] = findTaskPda(publicKey, taskId);
    const deadline =
      Math.floor(Date.now() / 1000) + parseInt(opts["deadline-minutes"] || "60", 10) * 60;
    const tx = await program.methods
      .createTask(Array.from(taskId), padBytes(opts.d, 256), new BN(deadline))
      .accounts({
        requester: publicKey,
        serviceListing: new PublicKey(opts["service-pda"]),
        taskRequest: taskRequestPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const data = { status: "ok", taskPda: taskRequestPda.toBase58(), tx };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "submit-result": async (args, wallet, publicKey) => {
    if (!wallet || !publicKey) return { output: "❌ Connect wallet first", error: true };
    const opts = parseArgs(args);
    if (!opts["task-pda"]) return { output: "Error: --task-pda required", error: true };
    if (!opts.r) return { output: "Error: -r <result> required", error: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = getProgram(wallet) as any;
    const encoded = new TextEncoder().encode(opts.r);
    const hashBuf = await crypto.subtle.digest("SHA-256", encoded.buffer as ArrayBuffer);
    const resultHash = Array.from(new Uint8Array(hashBuf));
    const tx = await program.methods
      .submitResult(resultHash)
      .accounts({ provider: publicKey, taskRequest: new PublicKey(opts["task-pda"]) })
      .rpc();
    const data = { status: "ok", taskPda: opts["task-pda"], tx };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "accept-result": async (args, wallet, publicKey) => {
    if (!wallet || !publicKey) return { output: "❌ Connect wallet first", error: true };
    const opts = parseArgs(args);
    if (!opts["task-pda"]) return { output: "Error: --task-pda required", error: true };

    // Fetch task to get provider and service info automatically
    const connection = getConnection();
    const program = getReadonlyProgram();
    const taskInfo = await connection.getAccountInfo(new PublicKey(opts["task-pda"]));
    if (!taskInfo) return { output: "❌ Task not found", error: true };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = (program.coder.accounts as any).decode("taskRequest", taskInfo.data);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txProgram = getProgram(wallet) as any;
    const tx = await txProgram.methods
      .acceptResult()
      .accounts({
        requester: publicKey,
        taskRequest: new PublicKey(opts["task-pda"]),
        provider: decoded.provider,
        serviceListing: decoded.serviceListing,
      })
      .rpc();
    const data = { status: "ok", taskPda: opts["task-pda"], action: "accepted", tx };
    return { output: `✅ Result accepted! Payment released.\n   Tx: ${shortAddr(tx)}`, data };
  },

  // x402 Payment Commands
  "x402-services": async () => {
    const response = await fetch("/api/x402/services");
    const data = await response.json();
    return { output: JSON.stringify(data, null, 2), data };
  },

  "x402-info": async (args) => {
    const serviceId = args[0] || parseArgs(args)._0 || parseArgs(args)["service-id"];
    if (!serviceId) return { output: "Usage: x402-info <service-id>", error: true };

    const response = await fetch(`/api/x402/${serviceId}`);
    const data = await response.json();
    if (!response.ok) {
      return { output: `Error: ${data.error}`, error: true };
    }
    return { output: JSON.stringify(data, null, 2), data };
  },
};

export async function executeCommand(
  input: string,
  wallet: AnchorWallet | undefined,
  publicKey: PublicKey | null,
): Promise<CommandResult> {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  if (!cmd) return { output: "" };
  if (cmd === "clear") return { output: "__CLEAR__" };

  const handler = commands[cmd];
  if (!handler) {
    return {
      output: `Unknown command: ${cmd}. Type 'help' for available commands.`,
      error: true,
    };
  }

  try {
    return await handler(args, wallet, publicKey);
  } catch (err: unknown) {
    return {
      output: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      error: true,
    };
  }
}

export const COMMAND_NAMES = Object.keys(commands);
