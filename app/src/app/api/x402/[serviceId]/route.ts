/**
 * POST /api/x402/[serviceId]
 * Protected x402 endpoint - requires payment
 */

import { type NextRequest, NextResponse } from "next/server";
import { USDC_MINT_DEVNET } from "@/lib/constants";
import { getConnection } from "@/lib/program";
import { getX402Service } from "@/lib/x402/config";
import { buildPaymentRequiredHeader } from "@/lib/x402/response";
import { verifyAndSubmitPayment } from "@/lib/x402/verify";

interface RouteParams {
  params: Promise<{ serviceId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { serviceId } = await params;
  const config = getX402Service(serviceId);

  if (!config) {
    return NextResponse.json({ error: "Service not found", serviceId }, { status: 404 });
  }

  const paymentHeader = request.headers.get("X-Payment");

  // No payment header = return 402 with payment terms
  if (!paymentHeader) {
    return new NextResponse(
      JSON.stringify({
        error: "Payment required",
        message: `This service requires payment of ${config.priceUsdc / 1_000_000} USDC`,
        serviceId,
      }),
      {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "X-Payment-Required": buildPaymentRequiredHeader(
            config.recipientWallet,
            config.priceUsdc,
            config.description,
          ),
        },
      },
    );
  }

  // Verify and submit payment
  const connection = getConnection();
  const result = await verifyAndSubmitPayment(
    connection,
    paymentHeader,
    config.recipientTokenAccount,
    config.priceUsdc,
    USDC_MINT_DEVNET,
  );

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Payment verification failed",
        details: result.error,
      },
      { status: 400 },
    );
  }

  // Payment verified - execute service logic
  let requestBody: unknown = {};
  try {
    requestBody = await request.json();
  } catch {
    // Body may be empty, that's ok
  }

  // For hackathon demo, return a simple echo response
  // In production, this would call the actual service logic
  const serviceResult = {
    message: `Service "${config.description}" executed successfully`,
    input: requestBody,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    paymentTx: result.signature,
    explorerUrl: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
    result: serviceResult,
  });
}

// Also support GET for service info
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { serviceId } = await params;
  const config = getX402Service(serviceId);

  if (!config) {
    return NextResponse.json({ error: "Service not found", serviceId }, { status: 404 });
  }

  return NextResponse.json({
    serviceId: config.servicePda,
    description: config.description,
    priceUsdc: config.priceUsdc / 1_000_000,
    recipientWallet: config.recipientWallet,
    endpoint: config.endpoint,
    paymentRequired: true,
  });
}
