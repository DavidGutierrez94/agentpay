import { useQuery } from "@tanstack/react-query";
import { PROGRAM_ID } from "../constants";
import { getConnection, getReadonlyProgram } from "../program";
import { lamportsToSol } from "../utils";

// Account sizes for filtering
const SERVICE_LISTING_SIZE = 218;
const TASK_REQUEST_SIZE = 435;

export interface ProtocolStats {
  totalServices: number;
  activeServices: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  escrowLockedSol: string;
  escrowLockedLamports: number;
  topProviders: { address: string; tasksCompleted: number }[];
}

export function useProtocolStats() {
  return useQuery({
    queryKey: ["protocol-stats"],
    queryFn: async (): Promise<ProtocolStats> => {
      const program = getReadonlyProgram();
      const connection = getConnection();

      const defaultStats: ProtocolStats = {
        totalServices: 0,
        activeServices: 0,
        totalTasks: 0,
        tasksByStatus: { open: 0, submitted: 0, completed: 0, disputed: 0, expired: 0 },
        escrowLockedSol: "0",
        escrowLockedLamports: 0,
        topProviders: [],
      };

      try {
        // Fetch raw accounts with dataSize filter to avoid incompatible schemas
        const [rawServiceAccounts, rawTaskAccounts] = await Promise.all([
          connection.getProgramAccounts(PROGRAM_ID, {
            filters: [{ dataSize: SERVICE_LISTING_SIZE }],
          }),
          connection.getProgramAccounts(PROGRAM_ID, {
            filters: [{ dataSize: TASK_REQUEST_SIZE }],
          }),
        ]);

        // Decode services
        const services: { provider: string; tasksCompleted: number; isActive: boolean }[] = [];
        for (const { account } of rawServiceAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode("serviceListing", account.data);
            services.push({
              provider: decoded.provider.toBase58(),
              tasksCompleted: decoded.tasksCompleted.toNumber(),
              isActive: decoded.isActive,
            });
          } catch {
            // Skip incompatible accounts
          }
        }

        // Decode tasks
        const tasks: { status: string; amountLamports: number }[] = [];
        for (const { account } of rawTaskAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode("taskRequest", account.data);
            tasks.push({
              status: Object.keys(decoded.status)[0],
              amountLamports: decoded.amountLamports.toNumber(),
            });
          } catch {
            // Skip incompatible accounts
          }
        }

        const tasksByStatus: Record<string, number> = {
          open: 0,
          submitted: 0,
          completed: 0,
          disputed: 0,
          expired: 0,
        };

        let escrowLockedLamports = 0;

        for (const t of tasks) {
          tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
          if (t.status === "open" || t.status === "submitted") {
            escrowLockedLamports += t.amountLamports;
          }
        }

        // Top providers by tasks completed
        const providerMap = new Map<string, number>();
        for (const s of services) {
          providerMap.set(s.provider, (providerMap.get(s.provider) || 0) + s.tasksCompleted);
        }

        const topProviders = Array.from(providerMap.entries())
          .map(([address, tasksCompleted]) => ({ address, tasksCompleted }))
          .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
          .slice(0, 10);

        return {
          totalServices: services.length,
          activeServices: services.filter((s) => s.isActive).length,
          totalTasks: tasks.length,
          tasksByStatus,
          escrowLockedSol: lamportsToSol(escrowLockedLamports),
          escrowLockedLamports,
          topProviders,
        };
      } catch (e) {
        console.error("Error fetching protocol stats:", e);
        return defaultStats;
      }
    },
    refetchInterval: 30000,
  });
}
