"use client";

import { useState } from "react";
import type { CommandResult } from "@/components/terminal/CommandRegistry";
import { Terminal } from "@/components/terminal/Terminal";
import { VisualPanel } from "@/components/terminal/VisualPanel";

export default function TerminalPage() {
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);

  return (
    <div className="mx-auto h-[calc(100vh-3.5rem)] max-w-[1400px] px-4 py-4">
      <div className="flex h-full flex-col gap-4 lg:flex-row">
        {/* Terminal - full width on mobile, left side on desktop */}
        <div className="h-[60vh] lg:h-full lg:flex-1">
          <Terminal onResult={setLastResult} />
        </div>
        {/* Visual Panel - full width on mobile, right side on desktop */}
        <div className="h-[40vh] lg:h-full lg:w-[400px]">
          <VisualPanel result={lastResult} />
        </div>
      </div>
    </div>
  );
}
