import type { VideoGenerationRequest } from "../api/video-generation-schema";

export interface FrasbergVideoTask {
  task_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  eta_seconds?: number;
  video_url?: string | null;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  } | null;
  region?: string;
}

export interface FrasbergVideoClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Shared Frasberg Video Generation SDK.
 * Used by frontend, backend, and agents.
 */
export class FrasbergVideoClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(opts: FrasbergVideoClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? "/api";
    this.apiKey = opts.apiKey;
    this.timeout = opts.timeout ?? 30000;
  }

  /**
   * Generate a new video.
   */
  async generateVideo(
    req: VideoGenerationRequest
  ): Promise<FrasbergVideoTask> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/generate/video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(req),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Video generation failed (${res.status}): ${text}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Poll task status.
   */
  async getTask(taskId: string): Promise<FrasbergVideoTask> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/v1/task/${taskId}`, {
        method: "GET",
        headers: {
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Get task failed (${res.status}): ${text}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Cancel a task.
   */
  async cancelTask(taskId: string): Promise<{ status: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}/v1/tasks/${taskId}/cancel`, {
        method: "POST",
        headers: {
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cancel task failed (${res.status}): ${text}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Poll task until completion.
   */
  async waitForCompletion(
    taskId: string,
    options?: { maxWaitMs?: number; pollIntervalMs?: number }
  ): Promise<FrasbergVideoTask> {
    const maxWaitMs = options?.maxWaitMs ?? 600000; // 10 minutes
    const pollIntervalMs = options?.pollIntervalMs ?? 1000;

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const task = await this.getTask(taskId);

      if (
        task.status === "completed" ||
        task.status === "failed" ||
        task.status === "cancelled"
      ) {
        return task;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Task ${taskId} did not complete within ${maxWaitMs}ms`);
  }
}
