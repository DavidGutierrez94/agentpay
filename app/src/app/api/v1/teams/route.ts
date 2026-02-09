/**
 * GET /api/v1/teams - List all teams
 * POST /api/v1/teams - Create a new team
 *
 * Multi-Agent Teams API for AgentPay
 * Based on patterns from Kevin Simback and Khaliq Gant
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Storage paths
const DATA_DIR = process.env.AGENTPAY_TEAMS_DIR || path.join(process.cwd(), "..", "mcp-server", "teams-data");
const TEAMS_FILE = path.join(DATA_DIR, "teams.json");
const CONTEXT_DIR = path.join(DATA_DIR, "contexts");

// Types
interface TeamMember {
  wallet: string;
  role: "lead" | "backend" | "frontend" | "researcher" | "reviewer" | "worker";
  level: 1 | 2 | 3 | 4;
  skills: string[];
  sharePercentage: number;
  joinedAt: number;
}

interface Team {
  id: string;
  name: string;
  leadWallet: string;
  members: TeamMember[];
  sharedContext: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

interface TeamsStore {
  teams: Team[];
  teamTasks: unknown[];
  lastUpdated: number;
}

// Initialize storage
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CONTEXT_DIR, { recursive: true });
    try {
      await fs.access(TEAMS_FILE);
    } catch {
      const initialData: TeamsStore = {
        teams: [],
        teamTasks: [],
        lastUpdated: Date.now(),
      };
      await fs.writeFile(TEAMS_FILE, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
}

// Read teams store
async function readStore(): Promise<TeamsStore> {
  await initStorage();
  const data = await fs.readFile(TEAMS_FILE, "utf-8");
  return JSON.parse(data);
}

// Write teams store
async function writeStore(store: TeamsStore) {
  await initStorage();
  store.lastUpdated = Date.now();
  await fs.writeFile(TEAMS_FILE, JSON.stringify(store, null, 2));
}

// GET /api/v1/teams
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberWallet = searchParams.get("memberWallet");
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const store = await readStore();
    let teams = store.teams;

    // Filter by member wallet
    if (memberWallet) {
      teams = teams.filter((t) =>
        t.members.some((m) => m.wallet === memberWallet)
      );
    }

    // Filter inactive by default
    if (!includeInactive) {
      teams = teams.filter((t) => t.isActive);
    }

    return NextResponse.json({
      success: true,
      count: teams.length,
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        leadWallet: t.leadWallet,
        description: t.description,
        memberCount: t.members.length,
        members: t.members.map((m) => ({
          wallet: m.wallet,
          role: m.role,
          level: m.level,
          sharePercentage: m.sharePercentage,
        })),
        isActive: t.isActive,
        createdAt: new Date(t.createdAt).toISOString(),
        updatedAt: new Date(t.updatedAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch teams",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/teams
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, leadWallet, members = [], description } = body;

    // Validation
    if (!name || typeof name !== "string" || name.length < 1 || name.length > 64) {
      return NextResponse.json(
        { success: false, error: "Invalid team name (1-64 characters required)" },
        { status: 400 }
      );
    }

    if (!leadWallet || typeof leadWallet !== "string" || leadWallet.length < 32 || leadWallet.length > 44) {
      return NextResponse.json(
        { success: false, error: "Invalid lead wallet address" },
        { status: 400 }
      );
    }

    const store = await readStore();
    const teamId = randomUUID();
    const now = Date.now();

    // Process members
    const processedMembers: TeamMember[] = [];

    // Ensure lead is in members list
    const leadInMembers = members.find((m: { wallet: string }) => m.wallet === leadWallet);
    if (!leadInMembers) {
      processedMembers.push({
        wallet: leadWallet,
        role: "lead",
        level: 4,
        skills: ["coordination", "planning"],
        sharePercentage: 0, // Lead keeps remainder
        joinedAt: now,
      });
    }

    // Add other members
    for (const m of members) {
      processedMembers.push({
        wallet: m.wallet,
        role: m.role || "worker",
        level: m.level || 2,
        skills: m.skills || [],
        sharePercentage: m.sharePercentage || 0,
        joinedAt: now,
      });
    }

    // Calculate default shares if not specified
    const totalShare = processedMembers.reduce((sum, m) => sum + m.sharePercentage, 0);
    if (totalShare === 0 && processedMembers.length > 1) {
      const nonLeadMembers = processedMembers.filter((m) => m.role !== "lead");
      const sharePerMember = Math.floor(80 / nonLeadMembers.length);
      nonLeadMembers.forEach((m) => {
        m.sharePercentage = sharePerMember;
      });
      const lead = processedMembers.find((m) => m.role === "lead");
      if (lead) {
        lead.sharePercentage = 100 - sharePerMember * nonLeadMembers.length;
      }
    }

    // Create shared context file
    const contextPath = path.join(CONTEXT_DIR, `${teamId}.md`);
    const contextContent = `# Team Context: ${name}

Created: ${new Date(now).toISOString()}
Lead: ${leadWallet}

## Working Context

_Add project context and notes here._

## Updates

`;
    await fs.writeFile(contextPath, contextContent);

    const team: Team = {
      id: teamId,
      name,
      leadWallet,
      members: processedMembers,
      sharedContext: contextPath,
      description,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    store.teams.push(team);
    await writeStore(store);

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        leadWallet: team.leadWallet,
        description: team.description,
        members: team.members.map((m) => ({
          wallet: m.wallet,
          role: m.role,
          level: m.level,
          sharePercentage: m.sharePercentage,
        })),
        createdAt: new Date(team.createdAt).toISOString(),
      },
      message: `Team "${name}" created with ${team.members.length} member(s)`,
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
