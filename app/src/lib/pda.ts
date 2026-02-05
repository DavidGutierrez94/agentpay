import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function findServicePda(
  provider: PublicKey,
  serviceId: Uint8Array | number[]
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("service"),
      provider.toBuffer(),
      Buffer.from(new Uint8Array(serviceId)),
    ],
    PROGRAM_ID
  );
}

export function findTaskPda(
  requester: PublicKey,
  taskId: Uint8Array | number[]
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("task"),
      requester.toBuffer(),
      Buffer.from(new Uint8Array(taskId)),
    ],
    PROGRAM_ID
  );
}
