/**
 * x402 Protocol Types
 * Based on https://github.com/coinbase/x402
 */

export interface X402Scheme {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  asset: string;
  recipient: string;
  extra?: {
    name?: string;
    description?: string;
  };
}

export interface X402PaymentRequired {
  x402Version: number;
  schemes: X402Scheme[];
}

export interface X402PaymentPayload {
  x402Version: number;
  scheme: "exact";
  network: string;
  payload: {
    serializedTransaction: string;
  };
}

export interface X402ServiceConfig {
  servicePda: string;
  endpoint: string;
  priceUsdc: number; // In smallest units (6 decimals)
  priceSol?: number; // In lamports
  recipientWallet: string;
  recipientTokenAccount: string;
  description: string;
  createdAt: number;
}

export interface X402VerifyResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export interface X402CallResult {
  success: boolean;
  data?: unknown;
  paymentTx?: string;
  error?: string;
}
