export function buildTaskEnvelope(task) {
  return {
    taskId: task.taskId,
    action: task.action,
    dynamics: task.dynamics,
    taskGraph: task.taskGraph,
    timestamp: Date.now()
  };
}
