"use client";

import Link from "next/link";
import { useState } from "react";
import { Board } from "@/components/board/Board";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { type ServiceListing, useServices } from "@/lib/hooks/useServices";

export default function BoardPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const { data: services } = useServices();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 font-mono">
      {/* Terminal Header */}
      <div className="mb-6 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div
                className="h-2 w-2 bg-[#ff3333]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
              <div
                className="h-2 w-2 bg-[#ffcc00]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
              <div
                className="h-2 w-2 bg-[var(--color-primary)]"
                style={{ borderRadius: "var(--border-radius-sm)" }}
              />
            </div>
            <span className="text-[var(--color-primary)] text-xs uppercase tracking-wider">
              TASK_BOARD
            </span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="border border-[var(--color-primary)] px-4 py-1.5 text-xs text-[var(--color-primary)] uppercase tracking-wider transition-all hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]"
            style={{ borderRadius: "var(--border-radius-sm)" }}
          >
            + CREATE_TASK
          </button>
        </div>
        <div className="p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">
            <span className="text-[var(--color-primary)]">$</span> cat ~/tasks --board
          </div>
          <p className="text-sm text-[var(--color-text)]">Real-time view of all on-chain tasks</p>
        </div>
      </div>

      <Board />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="mx-4 w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" />
                <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" style={{ opacity: 0.5 }} />
                <div className="h-1.5 w-1.5 bg-[var(--color-primary)]" style={{ opacity: 0.25 }} />
              </div>
              <span className="text-[var(--color-primary)] text-[10px] uppercase tracking-wider">
                SELECT_SERVICE
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">Select a Service</h2>
            <p className="mt-1 text-sm text-[var(--color-muted)]">Choose which service to hire</p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {services?.map((s: ServiceListing) => (
                <button
                  key={s.pda}
                  onClick={() => {
                    setSelectedService(s);
                    setShowCreate(false);
                  }}
                  className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-left transition-colors hover:border-[var(--color-primary)]"
                  style={{ borderRadius: "var(--border-radius-sm)" }}
                >
                  <p className="text-sm text-[var(--color-text)]">{s.description}</p>
                  <p className="mt-1 text-xs text-[var(--color-accent)]">{s.priceSol} SOL</p>
                </button>
              ))}
              {(!services || services.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-[var(--color-muted)]">[NO_SERVICES]</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Register one first to create tasks
                  </p>
                  <Link
                    href="/terminal"
                    onClick={() => setShowCreate(false)}
                    className="mt-3 inline-flex items-center gap-2 border border-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-bg)]"
                    style={{ borderRadius: "var(--border-radius-sm)" }}
                  >
                    &gt; OPEN_TERMINAL
                  </Link>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreate(false)}
              className="mt-4 w-full border border-[var(--color-border)] py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors"
              style={{ borderRadius: "var(--border-radius-sm)" }}
            >
              CANCEL
            </button>
          </div>
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
