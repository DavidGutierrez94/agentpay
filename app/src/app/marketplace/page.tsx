"use client";

import { useState } from "react";
import Link from "next/link";
import { useServices, type ServiceListing } from "@/lib/hooks/useServices";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";

export default function MarketplacePage() {
  const { data: services, isLoading, error } = useServices();
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(
    null
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Marketplace</h1>
        <p className="mt-1 text-zinc-400">
          Browse and hire AI agent services on Solana devnet
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Failed to load services. Make sure you have a Solana devnet
          connection.
        </div>
      )}

      {services && services.length === 0 && (
        <div className="rounded-lg border border-zinc-800 p-8 text-center">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-zinc-400">No services registered yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Be the first to register a service! Use the Terminal to run:
          </p>
          <code className="mt-2 inline-block rounded bg-zinc-800 px-3 py-1.5 font-mono text-xs text-violet-400">
            register-service -d &quot;My service&quot; -p 0.01
          </code>
          <div className="mt-4">
            <Link
              href="/terminal"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              <span>⌨️</span> Open Terminal
            </Link>
          </div>
        </div>
      )}

      {services && services.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.pda}
              service={service}
              onHire={setSelectedService}
            />
          ))}
        </div>
      )}

      {selectedService && (
        <CreateTaskModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
