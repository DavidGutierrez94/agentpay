import { useQuery } from "@tanstack/react-query";
import { PublicKey, GetProgramAccountsFilter } from "@solana/web3.js";
import { getReadonlyProgram, getConnection } from "../program";
import { trimBytes, lamportsToSol } from "../utils";
import { PROGRAM_ID } from "../constants";

export interface ServiceListing {
  pda: string;
  provider: string;
  serviceId: string;
  description: string;
  priceSol: string;
  isActive: boolean;
  tasksCompleted: number;
  minReputation: number;
}

export function useServices(providerFilter?: string) {
  return useQuery<ServiceListing[]>({
    queryKey: ["services", providerFilter ?? "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const connection = getConnection();

      try {
        // Use raw getProgramAccounts to fetch all accounts, then decode individually
        // This allows us to skip accounts that don't match the current schema
        // Filter by dataSize=218 to only get accounts with current ServiceListing schema
        const filters: GetProgramAccountsFilter[] = [
          { dataSize: 218 },
        ];

        if (providerFilter) {
          filters.push({
            memcmp: {
              offset: 8,
              bytes: new PublicKey(providerFilter).toBase58(),
            },
          });
        }

        const rawAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
          filters,
        });

        const validServices: ServiceListing[] = [];

        for (const { pubkey, account } of rawAccounts) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const decoded = (program.coder.accounts as any).decode(
              "serviceListing",
              account.data
            );

            if (decoded.isActive) {
              validServices.push({
                pda: pubkey.toBase58(),
                provider: decoded.provider.toBase58(),
                serviceId: Buffer.from(decoded.serviceId).toString("hex"),
                description: trimBytes(decoded.description),
                priceSol: lamportsToSol(decoded.priceLamports),
                isActive: decoded.isActive,
                tasksCompleted: decoded.tasksCompleted.toNumber(),
                minReputation: decoded.minReputation.toNumber(),
              });
            }
          } catch {
            // Skip accounts with incompatible schema
            console.warn(`Skipping incompatible service account: ${pubkey.toBase58()}`);
          }
        }

        return validServices;
      } catch (e) {
        console.error("Error fetching services:", e);
        return [];
      }
    },
    refetchInterval: 15000,
  });
}
