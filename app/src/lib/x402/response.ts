/**
 * x402 Response Builder
 * Builds HTTP 402 Payment Required responses with payment terms
 */

import { SOLANA_NETWORK_X402, USDC_MINT_DEVNET } from "../constants";
import type { X402PaymentRequired } from "./types";

export function buildPaymentRequiredHeader(
  recipientWallet: string,
  amountUsdc: number,
  serviceName?: string,
  serviceDescription?: string,
): string {
  const payload: X402PaymentRequired = {
    x402Version: 1,
    schemes: [
      {
        scheme: "exact",
        network: SOLANA_NETWORK_X402,
        maxAmountRequired: amountUsdc.toString(),
        asset: USDC_MINT_DEVNET,
        recipient: recipientWallet,
        extra: {
          name: serviceName,
          description: serviceDescription,
        },
      },
    ],
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function parsePaymentRequiredHeader(header: string): X402PaymentRequired {
  const decoded = Buffer.from(header, "base64").toString("utf-8");
  return JSON.parse(decoded) as X402PaymentRequired;
}
