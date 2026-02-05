/**
 * x402 Service Configuration Store
 * In-memory for hackathon scope (replace with Convex later)
 */

import type { X402ServiceConfig } from "./types";

// In-memory store for x402-enabled services
// Key: servicePda or serviceId
export const x402Services = new Map<string, X402ServiceConfig>();

export function registerX402Service(config: X402ServiceConfig): void {
  x402Services.set(config.servicePda, config);
}

export function getX402Service(serviceId: string): X402ServiceConfig | undefined {
  return x402Services.get(serviceId);
}

export function getAllX402Services(): X402ServiceConfig[] {
  return Array.from(x402Services.values());
}

export function removeX402Service(serviceId: string): boolean {
  return x402Services.delete(serviceId);
}
