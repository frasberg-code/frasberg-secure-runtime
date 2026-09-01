import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    if (!taskId || taskId.length === 0) {
      return NextResponse.json(
        { error: "Missing task ID" },
        { status: 400 }
      );
    }

    // Fetch task from metadata DB
    const task = await db.getTask(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Return task details
    return NextResponse.json({
      task_id: task.id,
      status: task.status,
      eta_seconds: task.eta_seconds,
      video_url: task.video_url,
      error: task.error,
      region: task.region,
      created_at: task.created_at,
      updated_at: task.updated_at,
    });
  } catch (err: any) {
    console.error("Error in GET /v1/task/:id:", err);
    return NextResponse.json(
      { error: "Internal error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
