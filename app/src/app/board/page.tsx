"use client";

import { useState } from "react";
import Link from "next/link";
import { Board } from "@/components/board/Board";
import { CreateTaskModal } from "@/components/board/CreateTaskModal";
import { useServices, type ServiceListing } from "@/lib/hooks/useServices";

export default function BoardPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(
    null
  );
  const { data: services } = useServices();

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time view of all on-chain tasks
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          + Create Task
        </button>
      </div>

      <Board />

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-bold text-white">Select a Service</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Choose which service to hire
            </p>
            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {services?.map((s: ServiceListing) => (
                <button
                  key={s.pda}
                  onClick={() => {
                    setSelectedService(s);
                    setShowCreate(false);
                  }}
                  className="w-full rounded-lg border border-zinc-800 p-3 text-left transition-colors hover:border-zinc-600"
                >
                  <p className="text-sm text-white">{s.description}</p>
                  <p className="mt-1 text-xs text-emerald-400">
                    {s.priceSol} SOL
                  </p>
                </button>
              ))}
              {(!services || services.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-500">No services available yet</p>
                  <p className="mt-2 text-xs text-zinc-600">
                    Register one first to create tasks
                  </p>
                  <Link
                    href="/terminal"
                    onClick={() => setShowCreate(false)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500"
                  >
                    <span>⌨️</span> Open Terminal
                  </Link>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreate(false)}
              className="mt-4 w-full rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
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
