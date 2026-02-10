"use client";

import { useState } from "react";

type AgentStatus = "running" | "idle" | "error";

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  team: "leadership" | "engineering" | "marketing" | "sales";
  isLead: boolean;
  description: string;
  schedule: string;
  budgetUsd: number;
  budgetSol: number;
  status: AgentStatus;
}

const agents: AgentInfo[] = [
  // Leadership
  {
    id: "ops",
    name: "Ops Lead",
    role: "ops",
    team: "leadership",
    isLead: true,
    description: "Team lead — health checks, cost audits, daily standups, weekly planning",
    schedule: "*/5min health, 6h cost audit, 9am standup, 6pm report, Mon 10am planning",
    budgetUsd: 10,
    budgetSol: 0.5,
    status: "running",
  },
  // Engineering
  {
    id: "dev",
    name: "Dev Lead",
    role: "dev",
    team: "engineering",
    isLead: true,
    description: "Tech lead & architect — task decomposition, code review, team coordination",
    schedule: "10min assignments, 3h code review, 4h coordination, 15min CI, 5pm report",
    budgetUsd: 10,
    budgetSol: 0.5,
    status: "running",
  },
  {
    id: "frontend",
    name: "Frontend",
    role: "frontend",
    team: "engineering",
    isLead: false,
    description: "Next.js 16, React 19, Tailwind, shadcn/ui — owns /app directory",
    schedule: "15min assignments, 2h UI work, 5pm report",
    budgetUsd: 8,
    budgetSol: 0.1,
    status: "idle",
  },
  {
    id: "backend",
    name: "Backend",
    role: "backend",
    team: "engineering",
    isLead: false,
    description: "MCP server, CLI, APIs, security — owns /mcp-server, /cli, /security",
    schedule: "15min assignments, 2h MCP work, 5pm report",
    budgetUsd: 8,
    budgetSol: 0.3,
    status: "idle",
  },
  {
    id: "web3",
    name: "Web3/Smart Contract",
    role: "web3",
    team: "engineering",
    isLead: false,
    description: "Anchor/Rust, ZK circuits, Solana programs — owns /programs, /circuits",
    schedule: "15min assignments, 2h chain work, 5pm report",
    budgetUsd: 10,
    budgetSol: 0.5,
    status: "idle",
  },
  // Marketing
  {
    id: "marketing",
    name: "Marketing Lead",
    role: "marketing",
    team: "marketing",
    isLead: true,
    description: "Strategy, content review, brand management — coordinates marketing team",
    schedule: "15min assignments, 4h review, 6h coordination, Mon strategy, 9am standup",
    budgetUsd: 5,
    budgetSol: 0.1,
    status: "running",
  },
  {
    id: "content",
    name: "Content Writer",
    role: "content",
    team: "marketing",
    isLead: false,
    description: "Blog posts, tutorials, documentation — developer-focused technical content",
    schedule: "15min assignments, MWF content creation, 5pm report",
    budgetUsd: 4,
    budgetSol: 0.05,
    status: "idle",
  },
  {
    id: "social",
    name: "Social Media",
    role: "social",
    team: "marketing",
    isLead: false,
    description: "Twitter/X management, community engagement, daily posts",
    schedule: "15min assignments, 11am daily post, 3h engagement, 6pm report",
    budgetUsd: 4,
    budgetSol: 0.05,
    status: "idle",
  },
  {
    id: "analytics",
    name: "Analytics",
    role: "analytics",
    team: "marketing",
    isLead: false,
    description: "Engagement metrics, site traffic, protocol metrics, weekly reports",
    schedule: "15min assignments, 7pm daily metrics, Mon report, 6h protocol check",
    budgetUsd: 3,
    budgetSol: 0.05,
    status: "idle",
  },
  // Sales
  {
    id: "sales",
    name: "Sales Lead",
    role: "sales",
    team: "sales",
    isLead: true,
    description: "Pipeline strategy, deal management — coordinates sales team",
    schedule: "15min assignments, 9am pipeline, 4h review, 6h coordination, Fri report",
    budgetUsd: 5,
    budgetSol: 0.2,
    status: "running",
  },
  {
    id: "research",
    name: "Lead Researcher",
    role: "research",
    team: "sales",
    isLead: false,
    description: "Identifies and qualifies potential clients in AI/Solana ecosystems",
    schedule: "15min assignments, 4h lead research, 5pm report",
    budgetUsd: 3,
    budgetSol: 0.05,
    status: "idle",
  },
  {
    id: "outreach",
    name: "Outreach",
    role: "outreach",
    team: "sales",
    isLead: false,
    description: "Personalized outreach emails, follow-ups, response tracking",
    schedule: "15min assignments, MWF outreach, 2pm follow-up, 5pm report",
    budgetUsd: 4,
    budgetSol: 0.1,
    status: "idle",
  },
  {
    id: "proposals",
    name: "Proposal Writer",
    role: "proposals",
    team: "sales",
    isLead: false,
    description: "Custom proposals, project scoping, timeline estimation, SOL pricing",
    schedule: "15min assignments, MWF proposals, 2pm tracking, 5pm report",
    budgetUsd: 4,
    budgetSol: 0.1,
    status: "idle",
  },
];

const teamColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  leadership: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/10",
  },
  engineering: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  marketing: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  sales: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    glow: "shadow-violet-500/10",
  },
};

const teamIcons: Record<string, string> = {
  leadership: "👑",
  engineering: "⚙️",
  marketing: "📢",
  sales: "💼",
};

const teamLabels: Record<string, string> = {
  leadership: "Leadership",
  engineering: "Engineering",
  marketing: "Marketing",
  sales: "Sales",
};

function StatusDot({ status }: { status: AgentStatus }) {
  const colors: Record<AgentStatus, string> = {
    running: "bg-emerald-400",
    idle: "bg-zinc-500",
    error: "bg-red-400",
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "running" && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors[status]}`} />
    </span>
  );
}

function AgentCard({ agent, onClick }: { agent: AgentInfo; onClick: () => void }) {
  const colors = teamColors[agent.team];
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border ${colors.border} ${colors.bg} p-4 text-left transition-all hover:shadow-lg ${colors.glow} hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} />
          <h3 className="font-semibold text-white">
            {agent.name}
            {agent.isLead && <span className="ml-1.5 text-xs text-amber-400">Lead</span>}
          </h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
        >
          {agent.role}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400 line-clamp-2">{agent.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <span>${agent.budgetUsd}/day</span>
        <span>{agent.budgetSol} SOL/day</span>
      </div>
    </button>
  );
}

function AgentDetail({ agent, onClose }: { agent: AgentInfo; onClose: () => void }) {
  const colors = teamColors[agent.team];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg rounded-2xl border ${colors.border} bg-zinc-900 p-6`}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white">
          ✕
        </button>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{teamIcons[agent.team]}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{agent.name}</h2>
            <p className={`text-sm ${colors.text}`}>
              {teamLabels[agent.team]} {agent.isLead ? "— Team Lead" : "— Specialist"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Status</h4>
            <div className="mt-1 flex items-center gap-2">
              <StatusDot status={agent.status} />
              <span className="text-sm capitalize text-white">{agent.status}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Description
            </h4>
            <p className="mt-1 text-sm text-zinc-300">{agent.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Schedule</h4>
            <p className="mt-1 text-sm text-zinc-300">{agent.schedule}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
              <h4 className="text-xs font-medium text-zinc-500">API Budget</h4>
              <p className="mt-1 text-lg font-semibold text-white">
                ${agent.budgetUsd}
                <span className="text-xs text-zinc-500">/day</span>
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
              <h4 className="text-xs font-medium text-zinc-500">SOL Budget</h4>
              <p className="mt-1 text-lg font-semibold text-white">
                {agent.budgetSol}
                <span className="text-xs text-zinc-500"> SOL/day</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Role ID</h4>
            <code className="mt-1 block rounded bg-zinc-800 px-3 py-1.5 font-mono text-xs text-violet-400">
              {agent.role}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamSection({ team, label }: { team: string; label: string }) {
  const teamAgents = agents.filter((a) => a.team === team);
  const lead = teamAgents.find((a) => a.isLead);
  const specialists = teamAgents.filter((a) => !a.isLead);
  const colors = teamColors[team];
  const [selected, setSelected] = useState<AgentInfo | null>(null);

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6`}>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">{teamIcons[team]}</span>
        <h2 className={`text-lg font-bold ${colors.text}`}>{label}</h2>
        <span className="ml-auto rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
          {teamAgents.length} agent{teamAgents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lead */}
      {lead && (
        <div className="mb-3">
          <AgentCard agent={lead} onClick={() => setSelected(lead)} />
        </div>
      )}

      {/* Specialists */}
      {specialists.length > 0 && (
        <div className="ml-4 space-y-2 border-l-2 border-zinc-700 pl-4">
          {specialists.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
          ))}
        </div>
      )}

      {selected && <AgentDetail agent={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function OrgPage() {
  const totalBudgetUsd = agents.reduce((sum, a) => sum + a.budgetUsd, 0);
  const totalBudgetSol = agents.reduce((sum, a) => sum + a.budgetSol, 0);
  const runningCount = agents.filter((a) => a.status === "running").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Organization</h1>
        <p className="mt-1 text-zinc-400">
          13 autonomous agents running AgentPay — organized into 4 teams
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium text-zinc-500">Total Agents</p>
          <p className="mt-1 text-2xl font-bold text-white">{agents.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium text-zinc-500">Running</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{runningCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium text-zinc-500">Daily API Budget</p>
          <p className="mt-1 text-2xl font-bold text-white">${totalBudgetUsd}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium text-zinc-500">Daily SOL Budget</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalBudgetSol.toFixed(2)}</p>
        </div>
      </div>

      {/* Org Chart */}
      <div className="space-y-6">
        {/* Leadership - full width */}
        <TeamSection team="leadership" label="Leadership" />

        {/* Engineering, Marketing, Sales - grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <TeamSection team="engineering" label="Engineering" />
          <TeamSection team="marketing" label="Marketing" />
          <TeamSection team="sales" label="Sales" />
        </div>
      </div>

      {/* Architecture Info */}
      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 text-2xl">🔗</div>
          <h3 className="font-semibold text-white">Shared Context</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Agents communicate asynchronously via CONTEXT.md files and a JSON task queue. No direct
            agent-to-agent calls.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 text-2xl">🛡️</div>
          <h3 className="font-semibold text-white">Security Hooks</h3>
          <p className="mt-1 text-sm text-zinc-400">
            7-layer security: budget limits, file write scoping, bash restrictions, keypair
            isolation, and audit logging.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 text-2xl">⚡</div>
          <h3 className="font-semibold text-white">Claude Agent SDK</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Each agent runs on the Claude Agent SDK with node-cron scheduling, deployed as K8s pods
            with isolated Solana keypairs.
          </p>
        </div>
      </div>
    </div>
  );
}
