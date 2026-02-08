import { useQuery } from "@tanstack/react-query";
import { getReadonlyProgram, getConnection } from "../program";
import { trimBytes, lamportsToSol } from "../utils";
import { PROGRAM_ID } from "../constants";

// Account sizes for filtering
const SERVICE_LISTING_SIZE = 218;
const TASK_REQUEST_SIZE = 435;

export interface AgentService {
  pda: string;
  serviceId: string;
  description: string;
  priceSol: string;
  isActive: boolean;
  tasksCompleted: number;
  createdAt: string;
}

export interface Agent {
  wallet: string;
  services: AgentService[];
  stats: {
    totalServices: number;
    activeServices: number;
    totalTasksCompleted: number;
    zkVerifiedCount: number;
    disputeCount: number;
    firstSeen: string;
  };
}

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const connection = getConnection();

      try {
        // Fetch all services and tasks in parallel
        const [rawServiceAccounts, rawTaskAccounts] = await Promise.all([
          connection.getProgramAccounts(PROGRAM_ID, {
            filters: [{ dataSize: SERVICE_LISTING_SIZE }],
          }),
          connection.getProgramAccounts(PROGRAM_ID, {
            filters: [{ dataSize: TASK_REQUEST_SIZE }],
          }),
        ]);

        // Group services by provider
        const agentServices = new Map<string, AgentService[]>();
        const agentFirstSeen = new Map<string, number>();

        for (const { pubkey, account } of rawServiceAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode(
              "serviceListing",
              account.data
            );

            const providerAddress = decoded.provider.toBase58();
            const createdAt = decoded.createdAt.toNumber();

            const service: AgentService = {
              pda: pubkey.toBase58(),
              serviceId: Buffer.from(decoded.serviceId).toString("hex"),
              description: trimBytes(decoded.description),
              priceSol: lamportsToSol(decoded.priceLamports),
              isActive: decoded.isActive,
              tasksCompleted: decoded.tasksCompleted.toNumber(),
              createdAt: new Date(createdAt * 1000).toISOString(),
            };

            if (!agentServices.has(providerAddress)) {
              agentServices.set(providerAddress, []);
            }
            agentServices.get(providerAddress)!.push(service);

            // Track first seen
            const existing = agentFirstSeen.get(providerAddress) || Infinity;
            if (createdAt < existing) {
              agentFirstSeen.set(providerAddress, createdAt);
            }
          } catch {
            // Skip incompatible accounts
          }
        }

        // Count task stats per provider
        const providerZkCount = new Map<string, number>();
        const providerDisputeCount = new Map<string, number>();

        for (const { account } of rawTaskAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode(
              "taskRequest",
              account.data
            );

            const providerAddress = decoded.provider.toBase58();
            const statusKey = Object.keys(decoded.status)[0];

            if (decoded.zkVerified) {
              providerZkCount.set(
                providerAddress,
                (providerZkCount.get(providerAddress) || 0) + 1
              );
            }

            if (statusKey === "disputed") {
              providerDisputeCount.set(
                providerAddress,
                (providerDisputeCount.get(providerAddress) || 0) + 1
              );
            }
          } catch {
            // Skip incompatible accounts
          }
        }

        // Build agent profiles
        const agents: Agent[] = [];

        for (const [wallet, services] of agentServices) {
          const totalTasksCompleted = services.reduce(
            (sum, s) => sum + s.tasksCompleted,
            0
          );

          agents.push({
            wallet,
            services,
            stats: {
              totalServices: services.length,
              activeServices: services.filter((s) => s.isActive).length,
              totalTasksCompleted,
              zkVerifiedCount: providerZkCount.get(wallet) || 0,
              disputeCount: providerDisputeCount.get(wallet) || 0,
              firstSeen: new Date(
                (agentFirstSeen.get(wallet) || 0) * 1000
              ).toISOString(),
            },
          });
        }

        // Sort by total tasks completed
        agents.sort(
          (a, b) => b.stats.totalTasksCompleted - a.stats.totalTasksCompleted
        );

        return agents;
      } catch (e) {
        console.error("Error fetching agents:", e);
        return [];
      }
    },
    refetchInterval: 30000,
  });
}

export function useAgent(wallet: string | undefined) {
  const { data: agents, ...rest } = useAgents();

  const agent = wallet
    ? agents?.find((a) => a.wallet === wallet)
    : undefined;

  return {
    data: agent,
    ...rest,
  };
}
