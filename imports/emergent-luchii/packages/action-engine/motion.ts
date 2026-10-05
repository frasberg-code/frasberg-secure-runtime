export function buildMotion(task) {
  return {
    taskMotion: task.action,
    dynamicsMotion: task.dynamics,
    timestamp: Date.now()
  };
}
