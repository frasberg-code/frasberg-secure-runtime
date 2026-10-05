import type { Task } from "./task-model";

export function buildTaskEnvelope(task: Task) {
  return {
    taskId: task.taskId,
    action: task.action,
    dynamics: task.dynamics,
    taskGraph: task.taskGraph,
    timestamp: Date.now()
  };
}
