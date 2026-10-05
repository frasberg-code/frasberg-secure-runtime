import { randomUUID } from 'node:crypto';
import type { ChatCompletionRequest } from './chat';

export type JobState = 'queued' | 'running' | 'completed' | 'failed';

export interface JobRecord {
  id: string;
  tenantId: string;
  state: JobState;
  createdAt: string;
  updatedAt: string;
  request: ChatCompletionRequest;
  result?: unknown;
  error?: string;
}

export interface JobRepository {
  create(job: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): JobRecord;
  get(id: string): JobRecord | undefined;
  update(
    id: string,
    updater: (job: JobRecord) => JobRecord,
  ): JobRecord | undefined;
  list(): JobRecord[];
}

export class InMemoryJobRepository implements JobRepository {
  private readonly jobs = new Map<string, JobRecord>();

  constructor(private readonly maxJobs = 100) {}

  create(job: Omit<JobRecord, 'id' | 'createdAt' | 'updatedAt'>): JobRecord {
    if (this.jobs.size >= this.maxJobs) {
      const oldestEntry = [...this.jobs.values()].sort((left, right) =>
        left.createdAt.localeCompare(right.createdAt),
      )[0];
      if (oldestEntry) {
        this.jobs.delete(oldestEntry.id);
      }
    }

    const now = new Date().toISOString();
    const record: JobRecord = {
      ...job,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(record.id, record);
    return record;
  }

  get(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  update(
    id: string,
    updater: (job: JobRecord) => JobRecord,
  ): JobRecord | undefined {
    const current = this.jobs.get(id);
    if (!current) {
      return undefined;
    }

    const updated = {
      ...updater(current),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  list(): JobRecord[] {
    return [...this.jobs.values()];
  }
}
