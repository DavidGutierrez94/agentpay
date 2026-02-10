import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types matching the API
export interface TeamMember {
  wallet: string;
  role: "lead" | "backend" | "frontend" | "researcher" | "reviewer" | "worker";
  level: 1 | 2 | 3 | 4;
  skills?: string[];
  sharePercentage: number;
  joinedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  leadWallet: string;
  description?: string;
  memberCount: number;
  members: TeamMember[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamDetail extends Team {
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalSubtasks: number;
    completedSubtasks: number;
  };
  recentTasks: {
    id: string;
    description: string;
    status: string;
    subtaskCount: number;
    completedSubtasks: number;
    createdAt: string;
  }[];
  context: string;
}

export interface CreateTeamParams {
  name: string;
  leadWallet: string;
  description?: string;
  members?: Omit<TeamMember, "joinedAt">[];
}

// Agent level names
export const AGENT_LEVEL_NAMES: Record<number, string> = {
  1: "Observer",
  2: "Advisor",
  3: "Operator",
  4: "Autonomous",
};

// Role icons
export const ROLE_ICONS: Record<string, string> = {
  lead: "👑",
  backend: "⚙️",
  frontend: "🎨",
  researcher: "🔍",
  reviewer: "📋",
  worker: "🔧",
};

// Fetch all teams
async function fetchTeams(memberWallet?: string): Promise<Team[]> {
  const params = new URLSearchParams();
  if (memberWallet) {
    params.set("memberWallet", memberWallet);
  }

  const res = await fetch(`/api/v1/teams?${params.toString()}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch teams");
  }

  return data.teams;
}

// Fetch single team
async function fetchTeam(teamId: string): Promise<TeamDetail> {
  const res = await fetch(`/api/v1/teams/${teamId}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch team");
  }

  return {
    ...data.team,
    stats: data.stats,
    recentTasks: data.recentTasks,
    context: data.context,
  };
}

// Create team
async function createTeam(params: CreateTeamParams): Promise<Team> {
  const res = await fetch("/api/v1/teams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to create team");
  }

  return data.team;
}

// Hook: Get all teams
export function useTeams(memberWallet?: string) {
  return useQuery<Team[]>({
    queryKey: ["teams", memberWallet ?? "all"],
    queryFn: () => fetchTeams(memberWallet),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Hook: Get single team
export function useTeam(teamId: string | null) {
  return useQuery<TeamDetail>({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeam(teamId!),
    enabled: !!teamId,
  });
}

// Hook: Create team
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
