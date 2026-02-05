/**
 * x402 Payment Verification
 * Verifies and submits Solana SPL token payments from X-Payment header
 */

import {
  Connection,
  VersionedTransaction,
  PublicKey,
} from "@solana/web3.js";
import type { X402PaymentPayload, X402VerifyResult } from "./types";

// SPL Token Program ID
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

// Transfer instruction discriminator (SPL Token)
const TRANSFER_INSTRUCTION = 3;

export function parsePaymentHeader(header: string): X402PaymentPayload {
  const decoded = Buffer.from(header, "base64").toString("utf-8");
  return JSON.parse(decoded) as X402PaymentPayload;
}

export async function verifyAndSubmitPayment(
  connection: Connection,
  paymentHeader: string,
  expectedRecipient: string,
  expectedAmount: number,
  expectedMint: string
): Promise<X402VerifyResult> {
  try {
    // 1. Decode X-Payment header
    const paymentData = parsePaymentHeader(paymentHeader);

    if (paymentData.x402Version !== 1) {
      return { success: false, error: "Unsupported x402 version" };
    }

    if (paymentData.scheme !== "exact") {
      return { success: false, error: "Only exact scheme supported" };
    }

    // 2. Deserialize transaction
    const txBuffer = Buffer.from(
      paymentData.payload.serializedTransaction,
      "base64"
    );

    let tx: VersionedTransaction;
    try {
      tx = VersionedTransaction.deserialize(txBuffer);
    } catch {
      return { success: false, error: "Invalid transaction format" };
    }

    // 3. Verify SPL Token transfer instruction
    const message = tx.message;
    let validTransfer = false;

    // Get account keys from the transaction
    const accountKeys = message.staticAccountKeys;

    for (const ix of message.compiledInstructions) {
      const programId = accountKeys[ix.programIdIndex];

      // Check if this is a Token Program instruction
      if (!programId.equals(TOKEN_PROGRAM_ID)) continue;

      // Check if this is a transfer instruction (discriminator = 3)
      if (ix.data[0] !== TRANSFER_INSTRUCTION) continue;

      // Parse transfer amount (8 bytes, little-endian, starting at offset 1)
      const amount = Number(
        Buffer.from(ix.data.slice(1, 9)).readBigUInt64LE()
      );

      // Get destination account from instruction accounts
      // For SPL Token transfer: [source, destination, authority]
      const destinationIndex = ix.accountKeyIndexes[1];
      const destinationAccount = accountKeys[destinationIndex];

      // Verify recipient and amount
      if (
        destinationAccount.toBase58() === expectedRecipient &&
        amount >= expectedAmount
      ) {
        validTransfer = true;
        break;
      }
    }

    if (!validTransfer) {
      return {
        success: false,
        error: `Invalid transfer: expected ${expectedAmount} to ${expectedRecipient}`,
      };
    }

    // 4. Simulate transaction before submitting
    const simulation = await connection.simulateTransaction(tx);
    if (simulation.value.err) {
      return {
        success: false,
        error: `Simulation failed: ${JSON.stringify(simulation.value.err)}`,
      };
    }

    // 5. Submit transaction
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // 6. Confirm transaction
    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed"
    );

    if (confirmation.value.err) {
      return {
        success: false,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
      };
    }

    return { success: true, signature };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
