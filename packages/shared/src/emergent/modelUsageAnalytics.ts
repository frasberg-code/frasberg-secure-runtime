interface ModelUsageRecord {
  provider: string;
  model: string;
  task: string;
  timestamp: number;
}

const MAX_RECORDS = 10000;
const MODEL_USAGE: ModelUsageRecord[] = [];

export function recordModelUsage(provider: string, model: string, task: string) {
  MODEL_USAGE.push({ provider, model, task, timestamp: Date.now() });
  if (MODEL_USAGE.length > MAX_RECORDS) {
    MODEL_USAGE.splice(0, MODEL_USAGE.length - MAX_RECORDS);
  }
}

export function getModelUsageSummary() {
  const byModel: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  const byTask: Record<string, number> = {};

  for (const u of MODEL_USAGE) {
    const key = `${u.provider}:${u.model}`;
    byModel[key] = (byModel[key] || 0) + 1;
    byProvider[u.provider] = (byProvider[u.provider] || 0) + 1;
    byTask[u.task] = (byTask[u.task] || 0) + 1;
  }

  return { byModel, byProvider, byTask };
}
