/**
 * AgentPay MCP Tools - Multi-Agent Teams
 *
 * MCP tools for creating and managing agent teams.
 * Based on patterns from Kevin Simback and Khaliq Gant.
 */

import * as teamsStorage from "../teams/storage.mjs";
import { getProgram } from "./program.mjs";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// ============================================================================
// Tool Definitions
// ============================================================================

export const teamTools = [
  {
    name: "create_team",
    description:
      "Create a new agent team. The lead wallet will be used for on-chain settlement. Team members can be added with roles, levels, and payment shares.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Team name (e.g., 'Wallet Analysis Squad')",
        },
        leadWallet: {
          type: "string",
          description: "Lead agent's Solana wallet address (used for on-chain settlement)",
        },
        members: {
          type: "array",
          description: "Initial team members (optional, lead is auto-added)",
          items: {
            type: "object",
            properties: {
              wallet: { type: "string", description: "Member's wallet address" },
              role: {
                type: "string",
                enum: ["lead", "backend", "frontend", "researcher", "reviewer", "worker"],
                description: "Member's role in the team",
              },
              level: {
                type: "number",
                enum: [1, 2, 3, 4],
                description: "Agent level (1=Observer, 2=Advisor, 3=Operator, 4=Autonomous)",
              },
              skills: {
                type: "array",
                items: { type: "string" },
                description: "List of skills/capabilities",
              },
              sharePercentage: {
                type: "number",
                description: "Payment share percentage (0-100)",
              },
            },
            required: ["wallet", "role"],
          },
        },
        description: {
          type: "string",
          description: "Team description/purpose",
        },
      },
      required: ["name", "leadWallet"],
    },
  },
  {
    name: "get_team",
    description: "Get details of a specific team by ID.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (UUID)",
        },
      },
      required: ["teamId"],
    },
  },
  {
    name: "list_teams",
    description:
      "List all teams or filter by member wallet. Returns active teams by default.",
    inputSchema: {
      type: "object",
      properties: {
        memberWallet: {
          type: "string",
          description: "Filter by member wallet address (optional)",
        },
        includeInactive: {
          type: "boolean",
          description: "Include inactive teams (default: false)",
        },
      },
    },
  },
  {
    name: "create_team_task",
    description:
      "Create a task assigned to a team. The lead will coordinate subtask assignment and submit the aggregated result to the on-chain task.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID that will work on this task",
        },
        onChainTaskPda: {
          type: "string",
          description: "PDA of the on-chain AgentPay task",
        },
        description: {
          type: "string",
          description: "Description of the overall task",
        },
      },
      required: ["teamId", "onChainTaskPda", "description"],
    },
  },
  {
    name: "get_team_task",
    description: "Get details of a specific team task including all subtasks.",
    inputSchema: {
      type: "object",
      properties: {
        teamTaskId: {
          type: "string",
          description: "Team task ID (UUID)",
        },
      },
      required: ["teamTaskId"],
    },
  },
  {
    name: "list_team_tasks",
    description: "List team tasks with optional filtering by team or status.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Filter by team ID (optional)",
        },
        status: {
          type: "string",
          enum: ["planning", "in_progress", "review", "submitted", "completed", "failed"],
          description: "Filter by status (optional)",
        },
      },
    },
  },
  {
    name: "assign_subtask",
    description:
      "Lead assigns a subtask to a team member. The member must be part of the team.",
    inputSchema: {
      type: "object",
      properties: {
        teamTaskId: {
          type: "string",
          description: "Team task ID",
        },
        assignedTo: {
          type: "string",
          description: "Wallet address of the team member to assign to",
        },
        description: {
          type: "string",
          description: "Description of what needs to be done",
        },
      },
      required: ["teamTaskId", "assignedTo", "description"],
    },
  },
  {
    name: "complete_subtask",
    description:
      "Worker marks a subtask as complete with result. When all subtasks are done, the team task moves to 'review' status.",
    inputSchema: {
      type: "object",
      properties: {
        teamTaskId: {
          type: "string",
          description: "Team task ID",
        },
        subtaskId: {
          type: "string",
          description: "Subtask ID to complete",
        },
        result: {
          type: "string",
          description: "Result of the completed subtask",
        },
      },
      required: ["teamTaskId", "subtaskId", "result"],
    },
  },
  {
    name: "submit_team_result",
    description:
      "Lead aggregates subtask results and submits to the on-chain task. This calls the AgentPay submit_result instruction.",
    inputSchema: {
      type: "object",
      properties: {
        teamTaskId: {
          type: "string",
          description: "Team task ID",
        },
        aggregatedResult: {
          type: "string",
          description: "Aggregated result from all subtasks (assembled by lead)",
        },
      },
      required: ["teamTaskId", "aggregatedResult"],
    },
  },
  {
    name: "distribute_payment",
    description:
      "After the on-chain task is accepted, lead distributes SOL to team members based on their share percentages.",
    inputSchema: {
      type: "object",
      properties: {
        teamTaskId: {
          type: "string",
          description: "Team task ID",
        },
      },
      required: ["teamTaskId"],
    },
  },
  {
    name: "get_team_context",
    description:
      "Read the shared context file for a team. This contains project notes, updates, and subtask completions.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID",
        },
      },
      required: ["teamId"],
    },
  },
  {
    name: "update_team_context",
    description:
      "Add an entry to the team's shared context. Use this to share notes, decisions, or questions with the team.",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID",
        },
        type: {
          type: "string",
          enum: ["update", "question", "decision", "note"],
          description: "Type of context entry",
        },
        content: {
          type: "string",
          description: "Content to add to the context",
        },
      },
      required: ["teamId", "type", "content"],
    },
  },
];

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Create a new team
 */
export async function createTeam(params) {
  try {
    const team = teamsStorage.createTeam({
      name: params.name,
      leadWallet: params.leadWallet,
      members: params.members || [],
      description: params.description,
    });

    return {
      success: true,
      team: {
        id: team.id,
        name: team.name,
        leadWallet: team.leadWallet,
        members: team.members.map((m) => ({
          wallet: m.wallet,
          role: m.role,
          level: m.level,
          sharePercentage: m.sharePercentage,
        })),
        sharedContext: team.sharedContext,
        createdAt: new Date(team.createdAt).toISOString(),
      },
      message: `Team "${team.name}" created with ${team.members.length} member(s)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get team details
 */
export async function getTeam(params) {
  try {
    const team = teamsStorage.getTeam(params.teamId);

    if (!team) {
      return {
        success: false,
        error: "Team not found",
      };
    }

    return {
      success: true,
      team: {
        ...team,
        createdAt: new Date(team.createdAt).toISOString(),
        updatedAt: new Date(team.updatedAt).toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List teams
 */
export async function listTeams(params = {}) {
  try {
    const teams = teamsStorage.listTeams({
      memberWallet: params.memberWallet,
      activeOnly: !params.includeInactive,
    });

    return {
      success: true,
      count: teams.length,
      teams: teams.map((t) => ({
        id: t.id,
        name: t.name,
        leadWallet: t.leadWallet,
        memberCount: t.members.length,
        isActive: t.isActive,
        createdAt: new Date(t.createdAt).toISOString(),
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a team task
 */
export async function createTeamTask(params) {
  try {
    const teamTask = teamsStorage.createTeamTask({
      teamId: params.teamId,
      onChainTaskPda: params.onChainTaskPda,
      description: params.description,
    });

    return {
      success: true,
      teamTask: {
        id: teamTask.id,
        teamId: teamTask.teamId,
        onChainTaskPda: teamTask.onChainTaskPda,
        description: teamTask.description,
        status: teamTask.status,
        createdAt: new Date(teamTask.createdAt).toISOString(),
      },
      message: "Team task created. Lead can now assign subtasks to members.",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get team task details
 */
export async function getTeamTask(params) {
  try {
    const teamTask = teamsStorage.getTeamTask(params.teamTaskId);

    if (!teamTask) {
      return {
        success: false,
        error: "Team task not found",
      };
    }

    return {
      success: true,
      teamTask: {
        ...teamTask,
        createdAt: new Date(teamTask.createdAt).toISOString(),
        updatedAt: new Date(teamTask.updatedAt).toISOString(),
        subtasks: teamTask.subtasks.map((s) => ({
          ...s,
          createdAt: new Date(s.createdAt).toISOString(),
          completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : null,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List team tasks
 */
export async function listTeamTasks(params = {}) {
  try {
    const tasks = teamsStorage.listTeamTasks({
      teamId: params.teamId,
      status: params.status,
    });

    return {
      success: true,
      count: tasks.length,
      teamTasks: tasks.map((t) => ({
        id: t.id,
        teamId: t.teamId,
        onChainTaskPda: t.onChainTaskPda,
        description: t.description.slice(0, 100) + (t.description.length > 100 ? "..." : ""),
        status: t.status,
        subtaskCount: t.subtasks.length,
        completedSubtasks: t.subtasks.filter((s) => s.status === "completed").length,
        createdAt: new Date(t.createdAt).toISOString(),
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Assign a subtask
 */
export async function assignSubtask(params) {
  try {
    const subtask = teamsStorage.assignSubtask({
      teamTaskId: params.teamTaskId,
      assignedTo: params.assignedTo,
      description: params.description,
    });

    return {
      success: true,
      subtask: {
        id: subtask.id,
        assignedTo: subtask.assignedTo,
        description: subtask.description,
        status: subtask.status,
        createdAt: new Date(subtask.createdAt).toISOString(),
      },
      message: `Subtask assigned to ${params.assignedTo.slice(0, 8)}...`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Complete a subtask
 */
export async function completeSubtask(params) {
  try {
    const teamTask = teamsStorage.completeSubtask({
      teamTaskId: params.teamTaskId,
      subtaskId: params.subtaskId,
      result: params.result,
    });

    const completedCount = teamTask.subtasks.filter(
      (s) => s.status === "completed"
    ).length;
    const totalCount = teamTask.subtasks.length;
    const allComplete = teamTask.status === "review";

    return {
      success: true,
      subtaskId: params.subtaskId,
      teamTaskStatus: teamTask.status,
      progress: `${completedCount}/${totalCount} subtasks complete`,
      message: allComplete
        ? "All subtasks complete! Team task is ready for lead to aggregate and submit."
        : `Subtask completed. ${totalCount - completedCount} remaining.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Submit team result to on-chain task
 */
export async function submitTeamResult(params) {
  try {
    const teamTask = teamsStorage.getTeamTask(params.teamTaskId);
    if (!teamTask) {
      return { success: false, error: "Team task not found" };
    }

    const team = teamsStorage.getTeam(teamTask.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Get the program to submit on-chain
    const { program, keypair } = await getProgram();

    // Verify the caller is the team lead
    const callerWallet = keypair.publicKey.toBase58();
    if (callerWallet !== team.leadWallet) {
      return {
        success: false,
        error: "Only the team lead can submit the result",
      };
    }

    // Submit to on-chain task
    const taskPda = new PublicKey(teamTask.onChainTaskPda);
    const tx = await program.methods
      .submitResult(params.aggregatedResult)
      .accounts({
        taskRequest: taskPda,
        provider: keypair.publicKey,
      })
      .signers([keypair])
      .rpc();

    // Update team task
    teamsStorage.updateTeamTask(params.teamTaskId, {
      status: "submitted",
      aggregatedResult: params.aggregatedResult,
      submitTxSignature: tx,
    });

    // Update context
    teamsStorage.appendToContext(team.id, {
      type: "update",
      author: team.leadWallet,
      content: `Result submitted to on-chain task.\nTx: ${tx}\nAwaiting requester acceptance.`,
    });

    return {
      success: true,
      txSignature: tx,
      message: "Result submitted to on-chain task. Awaiting requester acceptance.",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Distribute payment to team members
 */
export async function distributePayment(params) {
  try {
    const teamTask = teamsStorage.getTeamTask(params.teamTaskId);
    if (!teamTask) {
      return { success: false, error: "Team task not found" };
    }

    const team = teamsStorage.getTeam(teamTask.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Get the program to transfer SOL
    const { program, keypair, connection } = await getProgram();

    // Verify the caller is the team lead
    const callerWallet = keypair.publicKey.toBase58();
    if (callerWallet !== team.leadWallet) {
      return {
        success: false,
        error: "Only the team lead can distribute payment",
      };
    }

    // Get on-chain task to find payment amount
    const taskPda = new PublicKey(teamTask.onChainTaskPda);
    const taskAccount = await program.account.taskRequest.fetch(taskPda);

    // Task must be completed
    if (!taskAccount.status.completed) {
      return {
        success: false,
        error: "On-chain task is not yet completed/accepted",
      };
    }

    const totalLamports = taskAccount.priceLamports.toNumber();

    // Calculate distribution
    const distribution = teamsStorage.calculateDistribution(
      params.teamTaskId,
      totalLamports
    );

    // Execute transfers (skip lead, they already received the payment)
    const txSignatures = [];
    for (const { wallet, amount, role } of distribution) {
      if (wallet === team.leadWallet) continue;

      const tx = await connection.sendTransaction(
        new (await import("@solana/web3.js")).Transaction().add(
          SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(wallet),
            lamports: amount,
          })
        ),
        [keypair]
      );

      txSignatures.push({ wallet, amount, role, tx });
    }

    // Update team task
    teamsStorage.updateTeamTask(params.teamTaskId, {
      status: "completed",
      distributionTxSignatures: txSignatures.map((t) => t.tx),
    });

    // Update context
    const distributionSummary = distribution
      .map(
        (d) => `- ${d.role} (${d.wallet.slice(0, 8)}...): ${d.amount / LAMPORTS_PER_SOL} SOL`
      )
      .join("\n");

    teamsStorage.appendToContext(team.id, {
      type: "update",
      author: team.leadWallet,
      content: `Payment distributed!\n\n${distributionSummary}\n\nTotal: ${totalLamports / LAMPORTS_PER_SOL} SOL`,
    });

    return {
      success: true,
      totalLamports,
      distribution: distribution.map((d) => ({
        wallet: d.wallet,
        role: d.role,
        amountLamports: d.amount,
        amountSol: d.amount / LAMPORTS_PER_SOL,
      })),
      txSignatures: txSignatures.map((t) => t.tx),
      message: `Payment distributed to ${txSignatures.length} team members`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get team shared context
 */
export async function getTeamContext(params) {
  try {
    const context = teamsStorage.readContext(params.teamId);

    if (!context) {
      return {
        success: false,
        error: "Context not found for this team",
      };
    }

    return {
      success: true,
      teamId: params.teamId,
      context,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update team shared context
 */
export async function updateTeamContext(params) {
  try {
    const { keypair } = await getProgram();
    const authorWallet = keypair.publicKey.toBase58();

    teamsStorage.appendToContext(params.teamId, {
      type: params.type,
      author: authorWallet,
      content: params.content,
    });

    return {
      success: true,
      message: `Context updated with ${params.type} entry`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Export handlers map
// ============================================================================

export const teamHandlers = {
  create_team: createTeam,
  get_team: getTeam,
  list_teams: listTeams,
  create_team_task: createTeamTask,
  get_team_task: getTeamTask,
  list_team_tasks: listTeamTasks,
  assign_subtask: assignSubtask,
  complete_subtask: completeSubtask,
  submit_team_result: submitTeamResult,
  distribute_payment: distributePayment,
  get_team_context: getTeamContext,
  update_team_context: updateTeamContext,
};
