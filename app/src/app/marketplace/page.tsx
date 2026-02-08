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
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "tasks">("newest");

  // Filter and sort services
  const filteredServices = services
    ?.filter((s) => s.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return parseFloat(a.priceSol) - parseFloat(b.priceSol);
        case "price-desc":
          return parseFloat(b.priceSol) - parseFloat(a.priceSol);
        case "tasks":
          return b.tasksCompleted - a.tasksCompleted;
        default:
          return 0; // newest - default order from fetch
      }
    });

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

      {/* Search & Filter Bar */}
      {services && services.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 pl-10 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="tasks">Most Tasks</option>
            </select>
          </div>
        </div>
      )}

      {/* Result Count */}
      {filteredServices && filteredServices.length > 0 && (
        <div className="mb-4 text-sm text-zinc-500">
          {filteredServices.length} service{filteredServices.length !== 1 ? "s" : ""} found
          {search && ` for "${search}"`}
        </div>
      )}

      {/* No Search Results */}
      {filteredServices && filteredServices.length === 0 && search && (
        <div className="rounded-lg border border-zinc-800 p-8 text-center">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-zinc-400">No services match &quot;{search}&quot;</p>
          <button
            onClick={() => setSearch("")}
            className="mt-3 text-sm text-violet-400 hover:text-violet-300"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty State (no services at all) */}
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

      {/* Service Grid */}
      {filteredServices && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
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
