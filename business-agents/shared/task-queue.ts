import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { CONFIG } from "./config.js";
import { createAgentLogger } from "./logger.js";
import type { AgentRole, AgentTask, TaskPriority, TaskQueueStore, TaskStatus } from "./types.js";

const QUEUE_FILE = path.join(CONFIG.sharedStateDir, "task-queue.json");

function ensureStore(): void {
  const dir = path.dirname(QUEUE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(QUEUE_FILE)) {
    const initial: TaskQueueStore = { tasks: [], lastUpdated: new Date().toISOString() };
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(initial, null, 2));
  }
}

function readStore(): TaskQueueStore {
  ensureStore();
  return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
}

function writeStore(store: TaskQueueStore): void {
  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(store, null, 2));
}

export interface CreateTaskParams {
  title: string;
  description: string;
  assignedTo: AgentRole;
  assignedBy: AgentRole | "human";
  priority: TaskPriority;
  tags?: string[];
  dueDate?: string;
}

export function createTask(params: CreateTaskParams): AgentTask {
  const store = readStore();
  const now = new Date().toISOString();

  const task: AgentTask = {
    id: randomUUID(),
    title: params.title,
    description: params.description,
    assignedTo: params.assignedTo,
    assignedBy: params.assignedBy,
    priority: params.priority,
    status: "pending",
    tags: params.tags || [],
    createdAt: now,
    updatedAt: now,
    dueDate: params.dueDate,
  };

  store.tasks.push(task);
  writeStore(store);

  const logger = createAgentLogger(params.assignedBy === "human" ? "ops" : params.assignedBy);
  logger.info(`Task created: "${task.title}" -> ${task.assignedTo} [${task.priority}]`);

  return task;
}

export function getTask(taskId: string): AgentTask | null {
  const store = readStore();
  return store.tasks.find((t) => t.id === taskId) || null;
}

export function listTasks(filters?: {
  assignedTo?: AgentRole;
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string[];
}): AgentTask[] {
  const store = readStore();
  let tasks = store.tasks;

  if (filters?.assignedTo) {
    tasks = tasks.filter((t) => t.assignedTo === filters.assignedTo);
  }
  if (filters?.status) {
    tasks = tasks.filter((t) => t.status === filters.status);
  }
  if (filters?.priority) {
    tasks = tasks.filter((t) => t.priority === filters.priority);
  }
  if (filters?.tags && filters.tags.length > 0) {
    tasks = tasks.filter((t) => filters.tags!.some((tag) => t.tags.includes(tag)));
  }

  // Sort: critical > high > medium > low, then by creation date
  const priorityOrder: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => {
    const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priDiff !== 0) return priDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return tasks;
}

export function claimTask(taskId: string, agent: AgentRole): AgentTask | null {
  const store = readStore();
  const task = store.tasks.find((t) => t.id === taskId);

  if (!task || task.status !== "pending" || task.assignedTo !== agent) {
    return null;
  }

  task.status = "in_progress";
  task.updatedAt = new Date().toISOString();
  writeStore(store);

  const logger = createAgentLogger(agent);
  logger.info(`Task claimed: "${task.title}"`);

  return task;
}

export function completeTask(taskId: string, agent: AgentRole, result: string): AgentTask | null {
  const store = readStore();
  const task = store.tasks.find((t) => t.id === taskId);

  if (!task || task.assignedTo !== agent) {
    return null;
  }

  task.status = "completed";
  task.result = result;
  task.updatedAt = new Date().toISOString();
  writeStore(store);

  const logger = createAgentLogger(agent);
  logger.info(`Task completed: "${task.title}"`);

  return task;
}

export function blockTask(taskId: string, agent: AgentRole, reason: string): AgentTask | null {
  const store = readStore();
  const task = store.tasks.find((t) => t.id === taskId);

  if (!task || task.assignedTo !== agent) {
    return null;
  }

  task.status = "blocked";
  task.blockedReason = reason;
  task.updatedAt = new Date().toISOString();
  writeStore(store);

  const logger = createAgentLogger(agent);
  logger.warn(`Task blocked: "${task.title}" — ${reason}`);

  return task;
}

export function getQueueStats(): Record<string, number> {
  const store = readStore();
  const stats: Record<string, number> = {
    total: store.tasks.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    cancelled: 0,
  };

  for (const task of store.tasks) {
    stats[task.status] = (stats[task.status] || 0) + 1;
  }

  return stats;
}
