import { describe, expect, it, vi } from 'vitest';
import { buildApp, guardAgainstSelfRouting } from '../src/app';

describe('runtime router', () => {
  it('rejects obvious self-routing loops', () => {
    expect(() =>
      guardAgainstSelfRouting(
        'http://127.0.0.1:4001/v1/chat/completions',
        'http://127.0.0.1:4001',
      ),
    ).toThrow(/self-route/i);
  });

  it('validates chat payloads before proxying', async () => {
    const app = buildApp({ fetchImpl: vi.fn() as unknown as typeof fetch });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      payload: { messages: [] },
    });

    expect(response.statusCode).toBe(400);
  });

  it('proxies to the configured upstream', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ routed: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const app = buildApp({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      upstreamUrl: 'http://127.0.0.1:4010/v1/generations/chat',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ routed: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:4010/v1/generations/chat',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
