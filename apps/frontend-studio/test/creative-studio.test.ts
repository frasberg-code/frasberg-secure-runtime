import { describe, expect, it, vi } from 'vitest';
import { BackendCreativeStudio } from '../src/creative-studio';

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('BackendCreativeStudio', () => {
  it('polls backend job endpoint until completion', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({ id: 'job-1', state: 'queued' }),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({ id: 'job-1', state: 'running' }),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({ id: 'job-1', state: 'completed', result: { ok: true } }),
      );

    const studio = new BackendCreativeStudio({
      backendBaseUrl: 'http://127.0.0.1:4000',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      pollIntervalMs: 10,
      maxPollAttempts: 5,
    });

    const polling = studio.pollJob('job-1', { domain: 'music' });
    await vi.advanceTimersByTimeAsync(25);
    const response = await polling;

    expect(response.state).toBe('completed');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:4000/api/jobs/job-1?domain=music',
      expect.objectContaining({ method: 'GET' }),
    );
    vi.useRealTimers();
  });
});
