import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN, type Program } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { getProgram, getConnection, getReadonlyProgram } from "@/lib/program";
import { findTaskPda } from "@/lib/pda";
import { padBytes, trimBytes, lamportsToSol } from "@/lib/utils";

export interface CommandResult {
  output: string;
  data?: unknown;
  error?: boolean;
}

type CommandHandler = (
  args: string[],
  wallet: AnchorWallet | undefined,
  publicKey: PublicKey | null
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
    }
  }
  return map;
}

const commands: Record<string, CommandHandler> = {
  help: async () => ({
    output: `Available commands:
  help                    Show this help
  balance                 Show wallet balance
  wallet-info             Show wallet public key
  list-services           List all registered services
  list-tasks              List tasks (--requester <pk> --provider <pk> --status <s>)
  create-task             Create a task (--service-pda <pda> -d <desc> --deadline-minutes <m>)
  submit-result           Submit result (--task-pda <pda> -r <result>)
  accept-result           Accept result (--task-pda <pda> --provider <pk> --service-pda <pda>)
  dispute-task            Dispute task (--task-pda <pda>)
  clear                   Clear terminal`,
  }),

  balance: async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "Error: Connect wallet first", error: true };
    const connection = getConnection();
    const bal = await connection.getBalance(publicKey);
    const data = { status: "ok", wallet: publicKey.toBase58(), balanceSol: (bal / LAMPORTS_PER_SOL).toFixed(4) };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "wallet-info": async (_args, _wallet, publicKey) => {
    if (!publicKey) return { output: "Error: Connect wallet first", error: true };
    const data = { status: "ok", wallet: publicKey.toBase58() };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "list-services": async (args) => {
    const opts = parseArgs(args);
    const program = getReadonlyProgram();
    const filters = opts.provider
      ? [{ memcmp: { offset: 8, bytes: new PublicKey(opts.provider).toBase58() } }]
      : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = await (program.account as any).serviceListing.all(filters);
    const services = accounts.map((a: any) => ({
      pda: a.publicKey.toBase58(),
      provider: a.account.provider.toBase58(),
      description: trimBytes(a.account.description),
      priceSol: lamportsToSol(a.account.priceLamports),
      isActive: a.account.isActive,
      tasksCompleted: a.account.tasksCompleted.toNumber(),
    }));
    const data = { status: "ok", count: services.length, services };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "list-tasks": async (args) => {
    const opts = parseArgs(args);
    const program = getReadonlyProgram();
    const filters: any[] = [];
    if (opts.requester) filters.push({ memcmp: { offset: 8, bytes: new PublicKey(opts.requester).toBase58() } });
    if (opts.provider) filters.push({ memcmp: { offset: 40, bytes: new PublicKey(opts.provider).toBase58() } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = await (program.account as any).taskRequest.all(filters);
    let tasks = accounts.map((a: any) => {
      const statusKey = Object.keys(a.account.status)[0];
      return {
        pda: a.publicKey.toBase58(),
        requester: a.account.requester.toBase58(),
        provider: a.account.provider.toBase58(),
        description: trimBytes(a.account.description),
        amountSol: lamportsToSol(a.account.amountLamports),
        status: statusKey,
        deadline: new Date(a.account.deadline.toNumber() * 1000).toISOString(),
      };
    });
    if (opts.status) tasks = tasks.filter((t: any) => t.status === opts.status);
    const data = { status: "ok", count: tasks.length, tasks };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "create-task": async (args, wallet, publicKey) => {
    if (!wallet || !publicKey) return { output: "Error: Connect wallet first", error: true };
    const opts = parseArgs(args);
    if (!opts["service-pda"]) return { output: "Error: --service-pda required", error: true };
    if (!opts.d) return { output: "Error: -d <description> required", error: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = getProgram(wallet) as any;
    const taskId = crypto.getRandomValues(new Uint8Array(16));
    const [taskRequestPda] = findTaskPda(publicKey, taskId);
    const deadline = Math.floor(Date.now() / 1000) + parseInt(opts["deadline-minutes"] || "60") * 60;
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
    if (!wallet || !publicKey) return { output: "Error: Connect wallet first", error: true };
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
    if (!wallet || !publicKey) return { output: "Error: Connect wallet first", error: true };
    const opts = parseArgs(args);
    if (!opts["task-pda"] || !opts.provider || !opts["service-pda"])
      return { output: "Error: --task-pda, --provider, --service-pda required", error: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = getProgram(wallet) as any;
    const tx = await program.methods
      .acceptResult()
      .accounts({
        requester: publicKey,
        taskRequest: new PublicKey(opts["task-pda"]),
        provider: new PublicKey(opts.provider),
        serviceListing: new PublicKey(opts["service-pda"]),
      })
      .rpc();
    const data = { status: "ok", taskPda: opts["task-pda"], action: "accepted", tx };
    return { output: JSON.stringify(data, null, 2), data };
  },

  "dispute-task": async (args, wallet, publicKey) => {
    if (!wallet || !publicKey) return { output: "Error: Connect wallet first", error: true };
    const opts = parseArgs(args);
    if (!opts["task-pda"]) return { output: "Error: --task-pda required", error: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = getProgram(wallet) as any;
    const tx = await program.methods
      .disputeTask()
      .accounts({ requester: publicKey, taskRequest: new PublicKey(opts["task-pda"]) })
      .rpc();
    const data = { status: "ok", taskPda: opts["task-pda"], action: "disputed", tx };
    return { output: JSON.stringify(data, null, 2), data };
  },
};

export async function executeCommand(
  input: string,
  wallet: AnchorWallet | undefined,
  publicKey: PublicKey | null
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
