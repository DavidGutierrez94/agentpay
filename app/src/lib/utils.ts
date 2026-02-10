import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function padBytes(str: string, len: number): number[] {
  const buf = new Uint8Array(len);
  const encoded = new TextEncoder().encode(str);
  buf.set(encoded.slice(0, len));
  return Array.from(buf);
}

export function trimBytes(arr: number[]): string {
  const end = arr.indexOf(0);
  const bytes = new Uint8Array(end === -1 ? arr : arr.slice(0, end));
  return new TextDecoder().decode(bytes);
}

export function lamportsToSol(lamports: number | bigint): string {
  return (Number(lamports) / LAMPORTS_PER_SOL).toFixed(4);
}

export function solToLamports(sol: number | string): number {
  return Math.round(parseFloat(String(sol)) * LAMPORTS_PER_SOL);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "open":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "submitted":
      return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "completed":
      return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "disputed":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    case "expired":
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
    default:
      return "text-zinc-400 bg-zinc-400/10 border-zinc-400/20";
  }
}

export function getColumnColor(status: string): string {
  switch (status) {
    case "open":
      return "border-blue-500/30";
    case "submitted":
      return "border-orange-500/30";
    case "completed":
      return "border-emerald-500/30";
    case "disputed":
      return "border-red-500/30";
    case "expired":
      return "border-zinc-500/30";
    default:
      return "border-zinc-500/30";
  }
}
