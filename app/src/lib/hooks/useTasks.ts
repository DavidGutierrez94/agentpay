import { type GetProgramAccountsFilter, PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import type { TaskStatus } from "../constants";
import { PROGRAM_ID } from "../constants";
import { getConnection, getReadonlyProgram } from "../program";
import { lamportsToSol, trimBytes } from "../utils";

// TaskRequest account size: 435 bytes
const TASK_REQUEST_SIZE = 435;

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

export function useTasks(opts?: { requester?: string; provider?: string; status?: TaskStatus }) {
  return useQuery<TaskRequest[]>({
    queryKey: ["tasks", opts?.requester, opts?.provider, opts?.status],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const connection = getConnection();

      try {
        // Filter by dataSize to only get compatible TaskRequest accounts
        const filters: GetProgramAccountsFilter[] = [{ dataSize: TASK_REQUEST_SIZE }];

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

        const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
          filters,
        });

        const tasks: TaskRequest[] = [];

        for (const { pubkey, account } of rawAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);

            const statusKey = Object.keys(decoded.status)[0] as TaskStatus;
            const deadlineTs = decoded.deadline.toNumber();

            const task: TaskRequest = {
              pda: pubkey.toBase58(),
              taskId: Buffer.from(decoded.taskId).toString("hex"),
              requester: decoded.requester.toBase58(),
              provider: decoded.provider.toBase58(),
              serviceListing: decoded.serviceListing.toBase58(),
              description: trimBytes(decoded.description),
              amountSol: lamportsToSol(decoded.amountLamports),
              amountLamports: decoded.amountLamports.toNumber(),
              status: statusKey,
              resultHash:
                statusKey === "submitted" || statusKey === "completed"
                  ? Buffer.from(decoded.resultHash).toString("hex")
                  : null,
              deadline: new Date(deadlineTs * 1000).toISOString(),
              deadlineTs,
              zkVerified: decoded.zkVerified ?? false,
            };

            // Apply status filter if specified
            if (!opts?.status || task.status === opts.status) {
              tasks.push(task);
            }
          } catch {
            console.warn(`Skipping incompatible task account: ${pubkey.toBase58()}`);
          }
        }

        return tasks;
      } catch (e) {
        console.error("Error fetching tasks:", e);
        return [];
      }
    },
    refetchInterval: 10000,
  });
}

export function useAllTasks() {
  return useQuery<TaskRequest[]>({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const connection = getConnection();

      try {
        // Filter by dataSize to only get compatible TaskRequest accounts
        const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
          filters: [{ dataSize: TASK_REQUEST_SIZE }],
        });

        const tasks: TaskRequest[] = [];

        for (const { pubkey, account } of rawAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);

            const statusKey = Object.keys(decoded.status)[0] as TaskStatus;
            const deadlineTs = decoded.deadline.toNumber();

            tasks.push({
              pda: pubkey.toBase58(),
              taskId: Buffer.from(decoded.taskId).toString("hex"),
              requester: decoded.requester.toBase58(),
              provider: decoded.provider.toBase58(),
              serviceListing: decoded.serviceListing.toBase58(),
              description: trimBytes(decoded.description),
              amountSol: lamportsToSol(decoded.amountLamports),
              amountLamports: decoded.amountLamports.toNumber(),
              status: statusKey,
              resultHash:
                statusKey === "submitted" || statusKey === "completed"
                  ? Buffer.from(decoded.resultHash).toString("hex")
                  : null,
              deadline: new Date(deadlineTs * 1000).toISOString(),
              deadlineTs,
              zkVerified: decoded.zkVerified ?? false,
            });
          } catch {
            console.warn(`Skipping incompatible task account: ${pubkey.toBase58()}`);
          }
        }

        return tasks;
      } catch (e) {
        console.error("Error fetching all tasks:", e);
        return [];
      }
    },
    refetchInterval: 10000,
  });
}
