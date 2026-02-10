/**
 * GET /api/v1/teams/:teamId - Get team details
 * PATCH /api/v1/teams/:teamId - Update team
 *
 * Multi-Agent Teams API for AgentPay
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

// Storage paths
const DATA_DIR =
  process.env.AGENTPAY_TEAMS_DIR || path.join(process.cwd(), "..", "mcp-server", "teams-data");
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

interface SubTask {
  id: string;
  assignedTo: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: string;
  createdAt: number;
  completedAt?: number;
}

interface TeamTask {
  id: string;
  teamId: string;
  onChainTaskPda: string;
  description: string;
  subtasks: SubTask[];
  status: "planning" | "in_progress" | "review" | "submitted" | "completed" | "failed";
  aggregatedResult?: string;
  submitTxSignature?: string;
  distributionTxSignatures?: string[];
  createdAt: number;
  updatedAt: number;
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
  teamTasks: TeamTask[];
  lastUpdated: number;
}

// Read teams store
async function readStore(): Promise<TeamsStore> {
  try {
    const data = await fs.readFile(TEAMS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { teams: [], teamTasks: [], lastUpdated: Date.now() };
  }
}

// Write teams store
async function writeStore(store: TeamsStore) {
  store.lastUpdated = Date.now();
  await fs.writeFile(TEAMS_FILE, JSON.stringify(store, null, 2));
}

// GET /api/v1/teams/:teamId
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  try {
    const store = await readStore();
    const team = store.teams.find((t) => t.id === teamId);

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    // Get team tasks
    const teamTasks = store.teamTasks.filter((t) => t.teamId === teamId);

    // Get shared context
    let context = "";
    try {
      const contextPath = path.join(CONTEXT_DIR, `${teamId}.md`);
      context = await fs.readFile(contextPath, "utf-8");
    } catch {
      // Context file may not exist yet
    }

    // Calculate team stats
    const stats = {
      totalTasks: teamTasks.length,
      completedTasks: teamTasks.filter((t) => t.status === "completed").length,
      inProgressTasks: teamTasks.filter((t) => t.status === "in_progress").length,
      totalSubtasks: teamTasks.reduce((sum, t) => sum + t.subtasks.length, 0),
      completedSubtasks: teamTasks.reduce(
        (sum, t) => sum + t.subtasks.filter((s) => s.status === "completed").length,
        0,
      ),
    };

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
          skills: m.skills,
          sharePercentage: m.sharePercentage,
          joinedAt: new Date(m.joinedAt).toISOString(),
        })),
        isActive: team.isActive,
        createdAt: new Date(team.createdAt).toISOString(),
        updatedAt: new Date(team.updatedAt).toISOString(),
      },
      stats,
      recentTasks: teamTasks.slice(-5).map((t) => ({
        id: t.id,
        description: t.description.slice(0, 100) + (t.description.length > 100 ? "..." : ""),
        status: t.status,
        subtaskCount: t.subtasks.length,
        completedSubtasks: t.subtasks.filter((s) => s.status === "completed").length,
        createdAt: new Date(t.createdAt).toISOString(),
      })),
      context: context.slice(0, 2000) + (context.length > 2000 ? "\n\n... (truncated)" : ""),
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/v1/teams/:teamId
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;

  try {
    const body = await request.json();
    const store = await readStore();
    const teamIndex = store.teams.findIndex((t) => t.id === teamId);

    if (teamIndex === -1) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    const team = store.teams[teamIndex];
    const updates: Partial<Team> = {};

    // Only allow certain fields to be updated
    if (body.name && typeof body.name === "string") {
      updates.name = body.name.slice(0, 64);
    }
    if (body.description !== undefined) {
      updates.description = body.description ? body.description.slice(0, 256) : undefined;
    }
    if (body.isActive !== undefined) {
      updates.isActive = Boolean(body.isActive);
    }

    // Update team
    store.teams[teamIndex] = {
      ...team,
      ...updates,
      updatedAt: Date.now(),
    };

    await writeStore(store);

    return NextResponse.json({
      success: true,
      team: {
        id: store.teams[teamIndex].id,
        name: store.teams[teamIndex].name,
        description: store.teams[teamIndex].description,
        isActive: store.teams[teamIndex].isActive,
        updatedAt: new Date(store.teams[teamIndex].updatedAt).toISOString(),
      },
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update team",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
