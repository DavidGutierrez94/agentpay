import { AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import idl from "../../public/idl.json";
import { DEVNET_RPC } from "./constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProgram = Program<any>;

export function getConnection(): Connection {
  return new Connection(DEVNET_RPC, "confirmed");
}

export function getProgram(wallet: AnchorWallet): AnyProgram {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getReadonlyProgram(): AnyProgram {
  const connection = getConnection();
  const provider = {
    connection,
    publicKey: null,
  } as unknown as AnchorProvider;
  return new Program(idl as Idl, provider);
}
