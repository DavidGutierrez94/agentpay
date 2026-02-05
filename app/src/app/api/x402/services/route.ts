/**
 * GET /api/x402/services
 * List all x402-enabled services
 */

import { NextResponse } from "next/server";
import { getAllX402Services } from "@/lib/x402/config";

export async function GET() {
  const services = getAllX402Services().map((s) => ({
    serviceId: s.servicePda,
    endpoint: `/api/x402/${s.servicePda}`,
    priceUsdc: s.priceUsdc / 1_000_000, // Human-readable (6 decimals)
    description: s.description,
    recipientWallet: s.recipientWallet,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({
    count: services.length,
    services,
  });
}
