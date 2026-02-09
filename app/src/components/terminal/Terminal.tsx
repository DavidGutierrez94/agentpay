"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  executeCommand,
  COMMAND_NAMES,
  type CommandResult,
} from "./CommandRegistry";

interface HistoryEntry {
  input: string;
  result: CommandResult;
}

export function Terminal({
  onResult,
}: {
  onResult: (result: CommandResult) => void;
}) {
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const execute = useCallback(
    async (cmd: string) => {
      if (!cmd.trim()) return;
      setIsExecuting(true);
      setCmdHistory((prev) => [cmd, ...prev]);
      setHistoryIdx(-1);

      const result = await executeCommand(cmd, anchorWallet, publicKey);

      if (result.output === "__CLEAR__") {
        setHistory([]);
        setIsExecuting(false);
        return;
      }

      setHistory((prev) => [...prev, { input: cmd, result }]);
      onResult(result);
      setIsExecuting(false);
    },
    [anchorWallet, publicKey, onResult]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isExecuting) {
      execute(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < cmdHistory.length - 1) {
        const idx = historyIdx + 1;
        setHistoryIdx(idx);
        setInput(cmdHistory[idx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const idx = historyIdx - 1;
        setHistoryIdx(idx);
        setInput(cmdHistory[idx]);
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = COMMAND_NAMES.find((c) => c.startsWith(input));
      if (match) setInput(match);
    }
  };

  return (
    <div
      className="flex h-full flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] font-mono text-sm"
      style={{ borderRadius: "var(--border-radius)" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-2">
        <div className="h-3 w-3 bg-[#ff3333]" style={{ borderRadius: "var(--border-radius-sm)", opacity: 0.8 }} />
        <div className="h-3 w-3 bg-[#ffcc00]" style={{ borderRadius: "var(--border-radius-sm)", opacity: 0.8 }} />
        <div className="h-3 w-3 bg-[var(--color-primary)]" style={{ borderRadius: "var(--border-radius-sm)", opacity: 0.8 }} />
        <span className="ml-2 text-xs text-[var(--color-muted)] uppercase tracking-wider">
          AGENTPAY_TERMINAL — DEVNET
        </span>
      </div>

      {/* Scrollable output */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Welcome message */}
        <div className="mb-4 text-[var(--color-muted)]">
          <p className="text-[var(--color-primary)]">&gt; AgentPay Terminal v0.1.0 — Solana Devnet</p>
          <p className="text-xs mt-1">Type &apos;help&apos; for available commands.</p>
          <p className="mt-2">
            {publicKey ? (
              <span className="text-[var(--color-primary)]">
                [CONNECTED] {publicKey.toBase58().slice(0, 8)}...
              </span>
            ) : (
              <span className="text-[#ffcc00]">
                [WARN] Connect wallet to sign transactions
              </span>
            )}
          </p>
        </div>

        {/* History */}
        {history.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-primary)]">$</span>
              <span className="text-[var(--color-text)]">{entry.input}</span>
            </div>
            <pre
              className={`mt-1 whitespace-pre-wrap text-xs ${
                entry.result.error ? "text-[#ff3333]" : "text-[var(--color-muted)]"
              }`}
            >
              {entry.result.output}
            </pre>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 text-[var(--color-muted)]">
            <span className="animate-pulse">[EXECUTING...]</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <span className="text-[var(--color-primary)]">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
