import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "./config.js";
import type { AgentRole, ContextEntry } from "./types.js";

const CONTEXTS_DIR = path.join(CONFIG.sharedStateDir, "contexts");

function ensureDir(): void {
  if (!fs.existsSync(CONTEXTS_DIR)) {
    fs.mkdirSync(CONTEXTS_DIR, { recursive: true });
  }
}

function agentContextPath(agent: AgentRole): string {
  return path.join(CONTEXTS_DIR, `${agent}.md`);
}

function globalContextPath(): string {
  return path.join(CONTEXTS_DIR, "CONTEXT.md");
}

function initContextFile(filePath: string, title: string): void {
  if (!fs.existsSync(filePath)) {
    ensureDir();
    const content = `# ${title}\n\nCreated: ${new Date().toISOString()}\n\n## Updates\n\n`;
    fs.writeFileSync(filePath, content);
  }
}

export function readAgentContext(agent: AgentRole): string {
  const filePath = agentContextPath(agent);
  initContextFile(filePath, `${agent} Agent Context`);
  return fs.readFileSync(filePath, "utf-8");
}

export function readGlobalContext(): string {
  const filePath = globalContextPath();
  initContextFile(filePath, "AgentPay Business Team — Global Context");
  return fs.readFileSync(filePath, "utf-8");
}

export function appendToAgentContext(
  agent: AgentRole,
  entry: Omit<ContextEntry, "timestamp">,
): void {
  const filePath = agentContextPath(agent);
  initContextFile(filePath, `${agent} Agent Context`);

  const timestamp = new Date().toISOString();
  const block = `\n### [${timestamp}] ${entry.type.toUpperCase()} by ${entry.author}\n\n${entry.content}\n\n---\n`;
  fs.appendFileSync(filePath, block);
}

export function appendToGlobalContext(entry: Omit<ContextEntry, "timestamp">): void {
  const filePath = globalContextPath();
  initContextFile(filePath, "AgentPay Business Team — Global Context");

  const timestamp = new Date().toISOString();
  const block = `\n### [${timestamp}] ${entry.type.toUpperCase()} by ${entry.author}\n\n${entry.content}\n\n---\n`;
  fs.appendFileSync(filePath, block);
}

export function readAllAgentContexts(): Record<AgentRole, string> {
  const agents: AgentRole[] = [
    "ops",
    "dev",
    "frontend",
    "backend",
    "web3",
    "marketing",
    "content",
    "social",
    "analytics",
    "sales",
    "research",
    "outreach",
    "proposals",
  ];
  const result = {} as Record<AgentRole, string>;
  for (const agent of agents) {
    result[agent] = readAgentContext(agent);
  }
  return result;
}

export function writeAgentStatus(agent: AgentRole, status: string): void {
  appendToAgentContext(agent, {
    type: "status",
    author: agent,
    content: status,
  });
}

export function broadcastMessage(author: AgentRole, message: string): void {
  appendToGlobalContext({
    type: "broadcast",
    author,
    content: message,
  });
}
