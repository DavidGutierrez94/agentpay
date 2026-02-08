import { useQuery } from "@tanstack/react-query";
import { getReadonlyProgram } from "../program";
import { lamportsToSol, trimBytes } from "../utils";

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const acct = program.account as any;

      let services: { account: { provider: { toBase58: () => string }; tasksCompleted: { toNumber: () => number }; isActive: boolean } }[] = [];
      let tasks: { account: { status: object; amountLamports: { toNumber: () => number } } }[] = [];

      try {
        const [rawServices, rawTasks] = await Promise.all([
          acct.serviceListing.all(),
          acct.taskRequest.all(),
        ]);
        services = rawServices;
        tasks = rawTasks;
      } catch (e) {
        console.error("Error fetching protocol stats:", e);
        // Return default stats on error
        return {
          totalServices: 0,
          activeServices: 0,
          totalTasks: 0,
          tasksByStatus: { open: 0, submitted: 0, completed: 0, disputed: 0, expired: 0 },
          escrowLockedSol: "0",
          escrowLockedLamports: 0,
          topProviders: [],
        };
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
        const status = Object.keys(t.account.status)[0];
        tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
        if (status === "open" || status === "submitted") {
          escrowLockedLamports += t.account.amountLamports.toNumber();
        }
      }

      // Top providers by tasks completed
      const providerMap = new Map<string, number>();
      for (const s of services) {
        const addr = s.account.provider.toBase58();
        const completed = s.account.tasksCompleted.toNumber();
        providerMap.set(
          addr,
          (providerMap.get(addr) || 0) + completed
        );
      }

      const topProviders = Array.from(providerMap.entries())
        .map(([address, tasksCompleted]) => ({ address, tasksCompleted }))
        .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
        .slice(0, 10);

      return {
        totalServices: services.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeServices: services.filter((s: any) => s.account.isActive).length,
        totalTasks: tasks.length,
        tasksByStatus,
        escrowLockedSol: lamportsToSol(escrowLockedLamports),
        escrowLockedLamports,
        topProviders,
      };
    },
    refetchInterval: 30000,
  });
}
