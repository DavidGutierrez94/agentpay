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
      className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <div className="h-3 w-3 rounded-full bg-red-500/60" />
        <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
        <div className="h-3 w-3 rounded-full bg-green-500/60" />
        <span className="ml-2 text-xs text-zinc-500">
          agentpay terminal — devnet
        </span>
      </div>

      {/* Scrollable output */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Welcome message */}
        <div className="mb-4 text-zinc-500">
          <p>AgentPay Terminal v0.1.0 — Solana Devnet</p>
          <p>Type &apos;help&apos; for available commands.</p>
          <p className="mt-1">
            {publicKey ? (
              <span className="text-emerald-400">
                Wallet: {publicKey.toBase58().slice(0, 8)}...
              </span>
            ) : (
              <span className="text-yellow-400">
                Connect wallet to sign transactions
              </span>
            )}
          </p>
        </div>

        {/* History */}
        {history.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">$</span>
              <span className="text-zinc-300">{entry.input}</span>
            </div>
            <pre
              className={`mt-1 whitespace-pre-wrap text-xs ${
                entry.result.error ? "text-red-400" : "text-zinc-400"
              }`}
            >
              {entry.result.output}
            </pre>
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="animate-pulse">Executing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-zinc-800 px-4 py-3">
        <span className="text-emerald-400">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-zinc-300 placeholder-zinc-600 outline-none"
          autoFocus
        />
      </div>
    </div>
  );
}
