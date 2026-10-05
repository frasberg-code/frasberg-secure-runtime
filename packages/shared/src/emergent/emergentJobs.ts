export interface EmergentJobRecord {
  id: string;
  status: string;
  enginesUsed: string[];
  modelChoice: unknown;
  cost: { total: number; perEngine: Record<string, number> };
  createdAt: number;
  multimodal?: Record<string, unknown>;
  payload?: unknown;
}

const MAX_JOBS = 500;
const JOBS: EmergentJobRecord[] = [];

export function recordEmergentJob(
  job: Omit<EmergentJobRecord, 'createdAt'> & { createdAt?: number },
) {
  JOBS.push({ ...job, createdAt: job.createdAt ?? Date.now() });
  if (JOBS.length > MAX_JOBS) {
    JOBS.splice(0, JOBS.length - MAX_JOBS);
  }
}

export function listEmergentJobs(): EmergentJobRecord[] {
  return [...JOBS].reverse();
}

export function getEmergentJob(id: string): EmergentJobRecord | undefined {
  for (let i = JOBS.length - 1; i >= 0; i--) {
    if (JOBS[i].id === id) return JOBS[i];
  }
  return undefined;
}
