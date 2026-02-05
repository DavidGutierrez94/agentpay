import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { getReadonlyProgram } from "../program";
import { trimBytes, lamportsToSol } from "../utils";
import type { TaskStatus } from "../constants";

export interface TaskRequest {
  pda: string;
  taskId: string;
  requester: string;
  provider: string;
  serviceListing: string;
  description: string;
  amountSol: string;
  amountLamports: number;
  status: TaskStatus;
  resultHash: string | null;
  deadline: string;
  deadlineTs: number;
  zkVerified: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeTask(account: { publicKey: PublicKey; account: any }): TaskRequest {
  const a = account.account;
  const statusKey = Object.keys(a.status)[0] as TaskStatus;
  const deadlineTs = a.deadline.toNumber();
  return {
    pda: account.publicKey.toBase58(),
    taskId: Buffer.from(a.taskId).toString("hex"),
    requester: a.requester.toBase58(),
    provider: a.provider.toBase58(),
    serviceListing: a.serviceListing.toBase58(),
    description: trimBytes(a.description),
    amountSol: lamportsToSol(a.amountLamports),
    amountLamports: a.amountLamports.toNumber(),
    status: statusKey,
    resultHash:
      statusKey === "submitted" || statusKey === "completed"
        ? Buffer.from(a.resultHash).toString("hex")
        : null,
    deadline: new Date(deadlineTs * 1000).toISOString(),
    deadlineTs,
    zkVerified: a.zkVerified ?? false,
  };
}

export function useTasks(opts?: {
  requester?: string;
  provider?: string;
  status?: TaskStatus;
}) {
  return useQuery<TaskRequest[]>({
    queryKey: ["tasks", opts?.requester, opts?.provider, opts?.status],
    queryFn: async () => {
      const program = getReadonlyProgram();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filters: any[] = [];
      if (opts?.requester) {
        filters.push({
          memcmp: {
            offset: 8,
            bytes: new PublicKey(opts.requester).toBase58(),
          },
        });
      }
      if (opts?.provider) {
        filters.push({
          memcmp: {
            offset: 40,
            bytes: new PublicKey(opts.provider).toBase58(),
          },
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).taskRequest.all(filters);
      let tasks = accounts.map(decodeTask);
      if (opts?.status) {
        tasks = tasks.filter((t: TaskRequest) => t.status === opts.status);
      }
      return tasks;
    },
    refetchInterval: 10000,
  });
}

export function useAllTasks() {
  return useQuery<TaskRequest[]>({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).taskRequest.all();
      return accounts.map(decodeTask);
    },
    refetchInterval: 10000,
  });
}
