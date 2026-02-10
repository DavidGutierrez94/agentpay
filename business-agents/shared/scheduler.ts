import cron from "node-cron";
import { createAgentLogger } from "./logger.js";
import type { AgentRole, ScheduledJob } from "./types.js";

export type JobHandler = (job: ScheduledJob) => Promise<void>;

interface RunningJob {
  job: ScheduledJob;
  task: cron.ScheduledTask;
}

export class AgentScheduler {
  private jobs: RunningJob[] = [];
  private handler: JobHandler;
  private logger: ReturnType<typeof createAgentLogger>;
  private running = false;

  constructor(agent: AgentRole, handler: JobHandler) {
    this.agent = agent;
    this.handler = handler;
    this.logger = createAgentLogger(agent);
  }

  register(jobs: ScheduledJob[]): void {
    for (const job of jobs) {
      if (!job.enabled) {
        this.logger.info(`Skipping disabled job: ${job.name}`);
        continue;
      }

      if (!cron.validate(job.cron)) {
        this.logger.error(`Invalid cron expression for job ${job.name}: ${job.cron}`);
        continue;
      }

      const task = cron.schedule(
        job.cron,
        async () => {
          if (!this.running) return;

          this.logger.info(`Running job: ${job.name}`);
          const start = Date.now();

          try {
            await this.handler(job);
            this.logger.info(`Job completed: ${job.name} (${Date.now() - start}ms)`);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Job failed: ${job.name} — ${message}`);
          }
        },
        { scheduled: false },
      );

      this.jobs.push({ job, task });
      this.logger.info(`Registered job: ${job.name} [${job.cron}]`);
    }
  }

  start(): void {
    this.running = true;
    for (const { job, task } of this.jobs) {
      task.start();
      this.logger.info(`Started job: ${job.name}`);
    }
    this.logger.info(`Scheduler started with ${this.jobs.length} jobs`);
  }

  stop(): void {
    this.running = false;
    for (const { job, task } of this.jobs) {
      task.stop();
      this.logger.info(`Stopped job: ${job.name}`);
    }
    this.logger.info("Scheduler stopped");
  }

  async runJob(jobId: string): Promise<void> {
    const entry = this.jobs.find((j) => j.job.id === jobId);
    if (!entry) {
      throw new Error(`Job not found: ${jobId}`);
    }

    this.logger.info(`Manually running job: ${entry.job.name}`);
    await this.handler(entry.job);
  }

  listJobs(): ScheduledJob[] {
    return this.jobs.map((j) => j.job);
  }
}

export function createScheduler(agent: AgentRole, handler: JobHandler): AgentScheduler {
  return new AgentScheduler(agent, handler);
}
