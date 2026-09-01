import { z } from "zod";

/**
 * Canonical Zod schema for video generation requests.
 * This is the authoritative validation schema used by all handlers.
 */
export const videoGenerationSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt must be under 2000 characters")
    .describe("Text prompt describing the desired video"),

  duration: z
    .number()
    .int()
    .positive()
    .max(3600)
    .describe("Duration in seconds (1-3600)"),

  model: z
    .string()
    .min(1, "Model is required")
    .describe("Frasberg Engine model key"),

  ratio: z
    .enum(["16:9", "9:16", "1:1"])
    .default("16:9")
    .describe("Aspect ratio"),

  motion: z
    .enum(["low", "medium", "high"])
    .default("medium")
    .describe("Motion intensity"),

  guidance_scale: z
    .number()
    .min(0)
    .max(20)
    .default(7)
    .describe("Prompt adherence / guidance strength"),

  seed: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe("Optional seed for reproducibility"),

  output_format: z
    .enum(["mp4"])
    .default("mp4")
    .describe("Output container format"),
});

export type VideoGenerationRequest = z.infer<typeof videoGenerationSchema>;

/**
 * Task status schema for responses.
 */
export const frasbergTaskSchema = z.object({
  task_id: z.string().describe("Globally unique task ID"),
  status: z
    .enum(["queued", "running", "completed", "failed", "cancelled"])
    .describe("Current task status"),
  eta_seconds: z
    .number()
    .int()
    .optional()
    .describe("Estimated seconds to completion"),
  video_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe("CDN URL to video output"),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .nullable()
    .optional()
    .describe("Error details if status=failed"),
  region: z.string().optional().describe("Region where task is being processed"),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type FrasbergTask = z.infer<typeof frasbergTaskSchema>;
