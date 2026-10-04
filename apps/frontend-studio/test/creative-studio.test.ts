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
      apiKey: 'studio-api-key',
      tenantId: 'tenant-a',
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
    const pollHeaders = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(pollHeaders.get('authorization')).toBe('Bearer studio-api-key');
    expect(pollHeaders.get('x-tenant-id')).toBe('tenant-a');
    vi.useRealTimers();
  });

  it('routes image and voice generation through authenticated backend endpoints', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ job_id: 'job-2' }, 202));
    const studio = new BackendCreativeStudio({
      backendBaseUrl: 'http://127.0.0.1:4000/',
      apiKey: 'studio-api-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await studio.createImage({ prompt: 'image prompt' });
    await studio.createVoice({ prompt: 'voice prompt' });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      'http://127.0.0.1:4000/api/image',
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      'http://127.0.0.1:4000/api/voice',
    );
    const actionHeaders = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(actionHeaders.get('authorization')).toBe('Bearer studio-api-key');
  });

  it('requires authenticated backend configuration', () => {
    expect(
      () =>
        new BackendCreativeStudio({
          backendBaseUrl: 'http://127.0.0.1:4000',
          apiKey: '',
        }),
    ).toThrow('Studio backend URL and API key are required.');
  });
});
