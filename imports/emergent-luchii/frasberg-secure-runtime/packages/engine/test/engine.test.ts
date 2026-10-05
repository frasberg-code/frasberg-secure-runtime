import { describe, expect, it, vi } from 'vitest';
import { InMemoryJobRepository } from '@frasberg/shared';
import { JobService } from '../src/app';

describe('job service lifecycle', () => {
  it('transitions jobs from queued to completed', async () => {
    vi.useFakeTimers();
    const repository = new InMemoryJobRepository(10);
    const service = new JobService(repository, 5);

    const job = service.enqueue(
      {
        model: 'test-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
      'tenant-a',
    );

    expect(repository.get(job.id)?.state).toBe('queued');

    await vi.advanceTimersByTimeAsync(5);

    const completed = repository.get(job.id);
    expect(completed?.state).toBe('completed');
    expect(completed?.result).toBeTruthy();

    vi.useRealTimers();
  });

  it('evicts oldest jobs when the in-memory bound is reached', () => {
    const repository = new InMemoryJobRepository(1);

    const first = repository.create({
      tenantId: 'a',
      state: 'queued',
      request: { model: 'm', messages: [{ role: 'user', content: 'one' }] },
    });
    repository.create({
      tenantId: 'a',
      state: 'queued',
      request: { model: 'm', messages: [{ role: 'user', content: 'two' }] },
    });

    expect(repository.get(first.id)).toBeUndefined();
    expect(repository.list()).toHaveLength(1);
  });
});
