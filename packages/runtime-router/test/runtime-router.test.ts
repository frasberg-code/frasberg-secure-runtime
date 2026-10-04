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

  it('rejects invalid continuity context before proxying', async () => {
    const fetchImpl = vi.fn();
    const app = buildApp({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { 'x-continuity-id': 'x'.repeat(257) },
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('proxies to the configured upstream', async () => {
    const requestInits: RequestInit[] = [];
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        requestInits.push(init ?? {});
        return new Response(JSON.stringify({ routed: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    );
    const app = buildApp({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      upstreamUrl: 'http://127.0.0.1:4010/v1/generations/chat',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        'x-owner-id': 'owner-1',
        'x-continuity-id': 'continuity-1',
        'x-policy-id': 'policy-1',
      },
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ routed: true });
    const forwardedHeaders = new Headers(requestInits[0].headers);
    expect(forwardedHeaders.get('x-owner-id')).toBe('owner-1');
    expect(forwardedHeaders.get('x-tenant-id')).toBe('owner-1');
    expect(forwardedHeaders.get('x-continuity-id')).toBe('continuity-1');
    expect(forwardedHeaders.get('x-policy-id')).toBe('policy-1');
    expect(forwardedHeaders.get('x-request-id')).toBeTruthy();
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:4010/v1/generations/chat',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
