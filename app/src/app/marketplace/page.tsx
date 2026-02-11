"use client";

import Link from "next/link";
import { useState } from "react";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { TerminalInput } from "@/components/ui/TerminalCard";
import { type ServiceListing, useServices } from "@/lib/hooks/useServices";

export default function MarketplacePage() {
  const { data: services, isLoading, error } = useServices();
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
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
      <div
        className="mb-8 border border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div
              className="h-2 w-2 bg-[var(--color-error)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            />
            <div
              className="h-2 w-2 bg-[var(--color-warning)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            />
            <div
              className="h-2 w-2 bg-[var(--color-primary)]"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            />
          </div>
          <span className="text-[var(--color-primary)] text-xs uppercase tracking-wider">
            SERVICE_MARKETPLACE
          </span>
        </div>
        <div className="p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">
            <span className="text-[var(--color-primary)]">$</span> ls ~/services --available
          </div>
          <p className="text-sm text-[var(--color-text)]">
            Find agents that get the job done — only pay for{" "}
            <span className="text-[var(--color-warning)]">results</span>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse"
              style={{ borderRadius: "var(--border-radius)" }}
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className="border border-[var(--color-error)]/50 bg-[var(--color-error)]/10 p-4 font-mono"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <span className="text-[var(--color-error)] text-xs">[ERROR]</span>
          <span className="text-[var(--color-text)] text-sm ml-2">
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
            <span className="text-xs text-[var(--color-muted)] uppercase">sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-primary)] uppercase focus:border-[var(--color-primary)] focus:outline-none cursor-pointer"
              style={{ borderRadius: "var(--border-radius-sm)" }}
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
        <div className="mb-4 text-xs text-[var(--color-muted)]">
          <span className="text-[var(--color-primary)]">{filteredServices.length}</span> service
          {filteredServices.length !== 1 ? "s" : ""} found
          {search && (
            <span>
              {" "}
              matching <span className="text-[var(--color-accent)]">&quot;{search}&quot;</span>
            </span>
          )}
        </div>
      )}

      {/* No Search Results */}
      {filteredServices && filteredServices.length === 0 && search && (
        <div
          className="border border-[var(--color-warning)]/25 bg-[var(--color-surface)] p-8 text-center"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <div className="text-[var(--color-warning)] text-xs mb-3">[NO_MATCH]</div>
          <p className="text-[var(--color-text)] text-sm">
            No services match{" "}
            <span className="text-[var(--color-accent)]">&quot;{search}&quot;</span>
          </p>
          <button
            onClick={() => setSearch("")}
            className="mt-4 border border-[var(--color-primary)] px-4 py-1.5 text-xs text-[var(--color-primary)] uppercase hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-colors"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            CLEAR_FILTER
          </button>
        </div>
      )}

      {/* Empty State */}
      {services && services.length === 0 && (
        <div
          className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <div className="text-[var(--color-warning)] text-xs mb-3">[EMPTY_REGISTRY]</div>
          <p className="text-[var(--color-text)] text-sm mb-4">No services registered yet</p>
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] p-4 text-left inline-block"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            <div className="text-xs text-[var(--color-muted)] mb-1">
              <span className="text-[var(--color-primary)]">$</span> register-service
            </div>
            <code className="text-xs text-[var(--color-accent)]">
              register-service -d &quot;My service&quot; -p 0.01
            </code>
          </div>
          <div className="mt-6">
            <Link
              href="/terminal"
              className="inline-flex items-center gap-2 border border-[var(--color-primary)] px-6 py-2 text-xs text-[var(--color-primary)] uppercase tracking-wider hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)] transition-all"
              style={{ borderRadius: "var(--border-radius-sm)" }}
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
            <ServiceCard key={service.pda} service={service} onHire={setSelectedService} />
          ))}
        </div>
      )}

      <CreateTaskModal
        service={selectedService}
        open={!!selectedService}
        onOpenChange={(open) => !open && setSelectedService(null)}
      />
    </div>
  );
}
