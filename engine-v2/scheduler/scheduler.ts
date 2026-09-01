/**
 * Frasberg Engine v2 Scheduler
 *
 * Responsibilities:
 * - Dequeue tasks from queue
 * - Select GPU node based on model/region/load
 * - Dispatch task to worker
 * - Monitor task execution
 * - Update metadata DB
 * - Emit webhook events
 * - Handle failures and retries
 */

import * as os from "os";
import * as fs from "fs";

interface Task {
  id: string;
  model: string;
  region: string;
  prompt: string;
  duration: number;
  ratio: string;
  motion: string;
  guidance_scale: number;
  seed: number | null;
  output_format: string;
}

interface GPUNode {
  id: string;
  region: string;
  gpu_class: string;
  status: "healthy" | "degraded" | "unhealthy";
  utilization: number;
  active_tasks: number;
}

interface DispatchResult {
  success: boolean;
  task_id: string;
  gpu_node_id?: string;
  error?: string;
}

class Scheduler {
  private logger = this.createLogger();
  private highWatermark = 50;
  private lowWatermark = 20;
  private cooldownSeconds = 300;

  private createLogger() {
    return {
      info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
      error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
      warn: (msg: string) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
    };
  }

  /**
   * Main scheduler loop.
   */
  async schedulerLoop(): Promise<void> {
    this.logger.info("Starting scheduler loop");

    while (true) {
      try {
        // Dequeue next task
        const task = await this.dequeueTask();
        if (!task) {
          await this.sleep(500);
          continue;
        }

        this.logger.info(`Dequeued task: ${task.id}`);

        // Update task status to running
        await this.updateTaskStatus(task.id, "running");

        // Dispatch task
        const result = await this.dispatchTask(task);

        if (result.success) {
          this.logger.info(`Task ${task.id} dispatched to ${result.gpu_node_id}`);
          await this.emitEvent("video.task.running", {
            task_id: task.id,
            gpu_node: result.gpu_node_id,
          });
        } else {
          this.logger.error(`Task ${task.id} dispatch failed: ${result.error}`);
          await this.handleDispatchFailure(task, result.error || "unknown");
        }
      } catch (err) {
        this.logger.error(`Scheduler loop error: ${err}`);
        await this.sleep(5000);
      }
    }
  }

  /**
   * Dequeue next task from queue.
   */
  async dequeueTask(): Promise<Task | null> {
    try {
      // TODO: Implement queue dequeue logic
      return null;
    } catch (err) {
      this.logger.error(`Dequeue failed: ${err}`);
      return null;
    }
  }

  /**
   * Select GPU node for task.
   */
  async selectGpuNode(task: Task): Promise<GPUNode | null> {
    try {
      this.logger.info(`Selecting GPU for model=${task.model}, region=${task.region}`);

      // Get available GPU nodes
      const nodes = await this.getAvailableGpuNodes(task.region);

      if (nodes.length === 0) {
        this.logger.warn(`No GPU nodes available in ${task.region}`);
        throw new Error("NO_GPU_AVAILABLE");
      }

      // Select based on GPU class requirement
      const gpuClass = this.getGpuClassForModel(task.model);
      const suitable = nodes.filter((n) => n.gpu_class === gpuClass);

      if (suitable.length === 0) {
        this.logger.warn(`No ${gpuClass} nodes available`);
        throw new Error("NO_GPU_CLASS_AVAILABLE");
      }

      // Sort by utilization (prefer lowest load)
      suitable.sort((a, b) => a.utilization - b.utilization);

      const selected = suitable[0];
      this.logger.info(`Selected GPU node: ${selected.id} (utilization: ${selected.utilization})`);

      return selected;
    } catch (err) {
      this.logger.error(`GPU selection failed: ${err}`);
      throw err;
    }
  }

  /**
   * Dispatch task to GPU node.
   */
  async dispatchTask(task: Task): Promise<DispatchResult> {
    try {
      const gpuNode = await this.selectGpuNode(task);

      if (!gpuNode) {
        throw new Error("NO_GPU_AVAILABLE");
      }

      // TODO: Send task to worker via RPC/HTTP/gRPC
      this.logger.info(`Dispatching task ${task.id} to ${gpuNode.id}`);

      return {
        success: true,
        task_id: task.id,
        gpu_node_id: gpuNode.id,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "unknown";

      if (errorMsg === "NO_GPU_AVAILABLE") {
        // Trigger autoscaler
        await this.triggerAutoscaler(task.region);
        // Requeue task
        await this.requeueTask(task.id);
      }

      return {
        success: false,
        task_id: task.id,
        error: errorMsg,
      };
    }
  }

  /**
   * Handle dispatch failure.
   */
  async handleDispatchFailure(task: Task, error: string): Promise<void> {
    if (error === "NO_GPU_AVAILABLE") {
      // Requeue task
      await this.requeueTask(task.id);
      // Trigger autoscaler
      await this.triggerAutoscaler(task.region);
      this.logger.info(`Task ${task.id} requeued, autoscaler triggered`);
    } else if (error === "WORKER_UNRESPONSIVE") {
      // Mark task failed
      await this.updateTaskStatus(task.id, "failed", {
        code: "worker_unresponsive",
        message: error,
        retryable: false,
      });
    } else {
      // Mark task failed
      await this.updateTaskStatus(task.id, "failed", {
        code: "dispatch_failed",
        message: error,
        retryable: false,
      });
    }
  }

  /**
   * Get available GPU nodes in region.
   */
  async getAvailableGpuNodes(region: string): Promise<GPUNode[]> {
    // TODO: Query DB for healthy GPU nodes in region
    return [];
  }

  /**
   * Get GPU class for model.
   */
  getGpuClassForModel(model: string): string {
    const mapping: Record<string, string> = {
      "frasberg-engine": "gpu-medium",
      "frasberg-engine-turbo": "gpu-small",
      "frasberg-engine-cinema": "gpu-large",
      "frasberg-engine-veo": "gpu-large",
    };
    return mapping[model] || "gpu-medium";
  }

  /**
   * Requeue task.
   */
  async requeueTask(taskId: string): Promise<void> {
    // TODO: Implement requeue logic
    this.logger.info(`Requeued task: ${taskId}`);
  }

  /**
   * Trigger autoscaler.
   */
  async triggerAutoscaler(region: string): Promise<void> {
    this.logger.info(`Triggering autoscaler for region: ${region}`);
    // TODO: Implement autoscaler trigger
  }

  /**
   * Update task status.
   */
  async updateTaskStatus(
    taskId: string,
    status: string,
    error?: any
  ): Promise<void> {
    // TODO: Implement DB update
    this.logger.info(`Updated task ${taskId} status to ${status}`);
  }

  /**
   * Emit event.
   */
  async emitEvent(eventType: string, payload: any): Promise<void> {
    // TODO: Implement event emission
    this.logger.info(`Emitted event: ${eventType}`);
  }

  /**
   * Sleep utility.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Main entry point.
 */
async function main() {
  const scheduler = new Scheduler();

  try {
    await scheduler.schedulerLoop();
  } catch (err) {
    console.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { Scheduler, Task, GPUNode };
