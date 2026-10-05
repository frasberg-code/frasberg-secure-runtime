export function buildMotion(task: any) {
  return {
    taskMotion: task.action,
    dynamicsMotion: task.dynamics,
    timestamp: Date.now()
  };
}
