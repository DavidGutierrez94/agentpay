import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { getReadonlyProgram } from "../program";
import { trimBytes, lamportsToSol } from "../utils";

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

function decodeService(account: {
  publicKey: PublicKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  account: any;
}): ServiceListing {
  const a = account.account;
  return {
    pda: account.publicKey.toBase58(),
    provider: a.provider.toBase58(),
    serviceId: Buffer.from(a.serviceId).toString("hex"),
    description: trimBytes(a.description),
    priceSol: lamportsToSol(a.priceLamports),
    isActive: a.isActive,
    tasksCompleted: a.tasksCompleted.toNumber(),
    minReputation: a.minReputation.toNumber(),
  };
}

export function useServices(providerFilter?: string) {
  return useQuery<ServiceListing[]>({
    queryKey: ["services", providerFilter ?? "all"],
    queryFn: async () => {
      const program = getReadonlyProgram();
      const filters = providerFilter
        ? [
            {
              memcmp: {
                offset: 8,
                bytes: new PublicKey(providerFilter).toBase58(),
              },
            },
          ]
        : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).serviceListing.all(filters);
      return accounts.map(decodeService).filter((s: ServiceListing) => s.isActive);
    },
    refetchInterval: 15000,
  });
}
