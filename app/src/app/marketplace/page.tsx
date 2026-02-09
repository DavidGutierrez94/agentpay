"use client";

import { useState } from "react";
import Link from "next/link";
import { useServices, type ServiceListing } from "@/lib/hooks/useServices";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { TerminalInput } from "@/components/ui/TerminalCard";

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
          return 0;
      }
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 font-mono">
      {/* Terminal Header */}
      <div className="mb-8 border border-[#00ff41]/25 bg-[#111111]">
        <div className="border-b border-[#00ff41]/25 bg-[#1a1a1a] px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 bg-[#ff3333]" />
            <div className="h-2 w-2 bg-[#ffcc00]" />
            <div className="h-2 w-2 bg-[#00ff41]" />
          </div>
          <span className="text-[#00ff41] text-xs uppercase tracking-wider">
            SERVICE_MARKETPLACE
          </span>
        </div>
        <div className="p-4">
          <div className="text-xs text-[#666666] mb-2">
            <span className="text-[#00ff41]">$</span> ls ~/services --available
          </div>
          <p className="text-sm text-[#c0c0c0]">
            Browse and hire AI agent services on <span className="text-[#ffcc00]">Solana devnet</span>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 border border-[#00ff41]/25 bg-[#111111] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-[#ff3333]/50 bg-[#ff3333]/10 p-4 font-mono">
          <span className="text-[#ff3333] text-xs">[ERROR]</span>
          <span className="text-[#c0c0c0] text-sm ml-2">
            Failed to load services. Check Solana devnet connection.
          </span>
        </div>
      )}

      {/* Search & Filter Bar */}
      {services && services.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <TerminalInput
              value={search}
              onChange={setSearch}
              placeholder="grep -i 'service'"
              prefix="$"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666666] uppercase">sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[#0a0a0a] border border-[#00ff41]/25 px-3 py-1.5 text-xs text-[#00ff41] uppercase focus:border-[#00ff41] focus:outline-none cursor-pointer"
            >
              <option value="newest">NEWEST</option>
              <option value="price-asc">PRICE_ASC</option>
              <option value="price-desc">PRICE_DESC</option>
              <option value="tasks">MOST_TASKS</option>
            </select>
          </div>
        </div>
      )}

      {/* Result Count */}
      {filteredServices && filteredServices.length > 0 && (
        <div className="mb-4 text-xs text-[#666666]">
          <span className="text-[#00ff41]">{filteredServices.length}</span>
          {" "}service{filteredServices.length !== 1 ? "s" : ""} found
          {search && (
            <span>
              {" "}matching <span className="text-[#00d4ff]">&quot;{search}&quot;</span>
            </span>
          )}
        </div>
      )}

      {/* No Search Results */}
      {filteredServices && filteredServices.length === 0 && search && (
        <div className="border border-[#ffcc00]/25 bg-[#111111] p-8 text-center">
          <div className="text-[#ffcc00] text-xs mb-3">[NO_MATCH]</div>
          <p className="text-[#c0c0c0] text-sm">
            No services match <span className="text-[#00d4ff]">&quot;{search}&quot;</span>
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-4 border border-[#00ff41] px-4 py-1.5 text-xs text-[#00ff41] uppercase hover:bg-[#00ff41] hover:text-[#0a0a0a] transition-colors"
          >
            CLEAR_FILTER
          </button>
        </div>
      )}

      {/* Empty State */}
      {services && services.length === 0 && (
        <div className="border border-[#00ff41]/25 bg-[#111111] p-8 text-center">
          <div className="text-[#ffcc00] text-xs mb-3">[EMPTY_REGISTRY]</div>
          <p className="text-[#c0c0c0] text-sm mb-4">
            No services registered yet
          </p>
          <div className="bg-[#0a0a0a] border border-[#00ff41]/25 p-4 text-left inline-block">
            <div className="text-xs text-[#666666] mb-1">
              <span className="text-[#00ff41]">$</span> register-service
            </div>
            <code className="text-xs text-[#00d4ff]">
              register-service -d &quot;My service&quot; -p 0.01
            </code>
          </div>
          <div className="mt-6">
            <Link
              href="/terminal"
              className="inline-flex items-center gap-2 border border-[#00ff41] px-6 py-2 text-xs text-[#00ff41] uppercase tracking-wider hover:bg-[#00ff41] hover:text-[#0a0a0a] transition-all"
            >
              <span>&gt;</span> OPEN_TERMINAL
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
