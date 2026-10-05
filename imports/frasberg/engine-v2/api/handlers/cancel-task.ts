import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { queue } from "@/lib/queue";

export const runtime = "edge";

export async function POST(
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

    // Fetch task
    const task = await db.getTask(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only cancel if task is queued or running
    if (task.status === "completed" || task.status === "failed" || task.status === "cancelled") {
      return NextResponse.json(
        { error: `Cannot cancel task in ${task.status} state` },
        { status: 400 }
      );
    }

    // Mark task as cancelled
    await db.updateTaskStatus(taskId, "cancelled");

    // Remove from queue if still there
    await queue.remove(taskId);

    // TODO: Emit cancellation webhook

    return NextResponse.json({
      task_id: taskId,
      status: "cancelled",
    });
  } catch (err: any) {
    console.error("Error in POST /v1/tasks/:id/cancel:", err);
    return NextResponse.json(
      { error: "Internal error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
