import { NextRequest, NextResponse } from "next/server";
import { videoGenerationSchema } from "@/lib/videoGenerationSchema";
import {
  resolveFrasbergEngineTarget,
  type FrasbergVideoModel,
  estimateCredits,
} from "@/lib/frasbergVideoModelRouter";
import { db } from "@/lib/db";
import { queue } from "@/lib/queue";
import { generateTaskId } from "@/lib/id-gen";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const json = await req.json();
    const parsed = videoGenerationSchema.parse(json);

    // Resolve model to target region
    const target = resolveFrasbergEngineTarget(
      parsed.model as FrasbergVideoModel
    );

    // Generate task ID
    const taskId = generateTaskId();

    // Estimate credits
    const estimatedCredits = estimateCredits(
      parsed.model as FrasbergVideoModel,
      parsed.duration
    );

    // TODO: Check user credits balance and reserve

    // Insert task into metadata DB
    await db.insertTask({
      id: taskId,
      model: parsed.model,
      region: target.region,
      status: "queued",
      prompt: parsed.prompt,
      duration: parsed.duration,
      ratio: parsed.ratio,
      motion: parsed.motion,
      guidance_scale: parsed.guidance_scale,
      seed: parsed.seed ?? null,
      output_format: parsed.output_format,
      estimated_credits: estimatedCredits,
    });

    // Enqueue task
    await queue.enqueue({
      id: taskId,
      model: parsed.model,
      region: target.region,
      payload: parsed,
    });

    // Return task ID and status
    return NextResponse.json(
      {
        task_id: taskId,
        status: "queued",
        region: target.region,
        eta_seconds: 30,
      },
      { status: 202 }
    );
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body", issues: err.issues },
        { status: 400 }
      );
    }

    console.error("Error in POST /v1/generate:", err);
    return NextResponse.json(
      { error: "Internal error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
