/**
 * useX402 - Client-side hook for x402 HTTP payments
 * Handles the full 402 payment flow with Solana wallet
 */

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { useCallback, useState } from "react";
import type { X402CallResult, X402PaymentRequired } from "../x402/types";

// SPL Token Program
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// Associated Token Program
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

// Derive Associated Token Address
function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

// Create SPL Token transfer instruction
function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number
): TransactionInstruction {
  // SPL Token Transfer instruction layout:
  // [0]: instruction (3 = Transfer)
  // [1-8]: amount (u64, little-endian)
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0); // Transfer instruction
  data.writeBigUInt64LE(BigInt(amount), 1);

  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data,
  });
}

export interface UseX402Return {
  callWithPayment: (
    endpoint: string,
    body?: unknown
  ) => Promise<X402CallResult>;
  isLoading: boolean;
  error: string | null;
}

export function useX402(): UseX402Return {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callWithPayment = useCallback(
    async (endpoint: string, body?: unknown): Promise<X402CallResult> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!publicKey || !signTransaction) {
          const err = "Wallet not connected";
          setError(err);
          return { success: false, error: err };
        }

        // Step 1: Request without payment to get 402 terms
        const initialResponse = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });

        // If not 402, either success or error
        if (initialResponse.status !== 402) {
          if (initialResponse.ok) {
            const data = await initialResponse.json();
            return { success: true, data };
          }
          const err = `Request failed with status ${initialResponse.status}`;
          setError(err);
          return { success: false, error: err };
        }

        // Step 2: Parse payment requirements from 402 response
        const paymentRequiredHeader = initialResponse.headers.get(
          "X-Payment-Required"
        );
        if (!paymentRequiredHeader) {
          const err = "Missing X-Payment-Required header";
          setError(err);
          return { success: false, error: err };
        }

        const paymentTerms: X402PaymentRequired = JSON.parse(
          Buffer.from(paymentRequiredHeader, "base64").toString("utf-8")
        );

        const scheme = paymentTerms.schemes[0];
        if (!scheme || scheme.scheme !== "exact") {
          const err = "Unsupported payment scheme";
          setError(err);
          return { success: false, error: err };
        }

        // Step 3: Build payment transaction
        const mint = new PublicKey(scheme.asset);
        const recipient = new PublicKey(scheme.recipient);
        const amount = parseInt(scheme.maxAmountRequired);

        // Get payer's and recipient's token accounts
        const payerAta = getAssociatedTokenAddress(mint, publicKey);
        const recipientAta = getAssociatedTokenAddress(mint, recipient);

        // Check balance
        try {
          const balance = await connection.getTokenAccountBalance(payerAta);
          if (parseInt(balance.value.amount) < amount) {
            const err = `Insufficient USDC balance. Need ${amount / 1_000_000} USDC`;
            setError(err);
            return { success: false, error: err };
          }
        } catch {
          const err = "Could not fetch token balance. Do you have a USDC account?";
          setError(err);
          return { success: false, error: err };
        }

        // Build transaction
        const tx = new Transaction();
        tx.add(
          createTransferInstruction(payerAta, recipientAta, publicKey, amount)
        );

        tx.feePayer = publicKey;
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;

        // Step 4: Sign transaction
        const signedTx = await signTransaction(tx);

        // Step 5: Build X-Payment header
        const paymentPayload = {
          x402Version: 1,
          scheme: "exact" as const,
          network: scheme.network,
          payload: {
            serializedTransaction: signedTx
              .serialize({ requireAllSignatures: true })
              .toString("base64"),
          },
        };

        const xPaymentHeader = Buffer.from(
          JSON.stringify(paymentPayload)
        ).toString("base64");

        // Step 6: Retry with payment
        const finalResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": xPaymentHeader,
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (finalResponse.ok) {
          const data = await finalResponse.json();
          return {
            success: true,
            data,
            paymentTx: data.paymentTx,
          };
        }

        const errorData = await finalResponse.json();
        const err = errorData.error || "Payment verification failed";
        setError(err);
        return { success: false, error: err };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, signTransaction, connection]
  );

  return { callWithPayment, isLoading, error };
}
