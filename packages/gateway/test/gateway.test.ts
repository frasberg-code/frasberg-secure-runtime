import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app';

const apiKeys = [
  {
    id: 'key-1',
    secret: 'secret-1',
    permissions: ['chat', 'jobs:read'] as const,
    tenants: ['tenant-a'],
  },
];

describe('gateway auth and routing', () => {
  it('returns FK-001 when API key is missing', async () => {
    const app = buildApp({
      apiKeys,
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        code: 'FK-001',
        message: 'Invalid or missing API key.',
      },
    });
  });

  it('returns FK-003 when permission is missing', async () => {
    const app = buildApp({
      apiKeys,
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        'x-api-key': 'secret-1',
      },
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: {
        code: 'FK-003',
        message: 'Authenticated principal is missing the required permission.',
      },
    });
  });

  it('rate limits repeated requests from the same client', async () => {
    const app = buildApp({
      apiKeys,
      fetchImpl: vi.fn() as unknown as typeof fetch,
      rateLimitMax: 1,
      rateLimitWindowMs: 60_000,
    });

    await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        'x-api-key': 'secret-1',
      },
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        'x-api-key': 'secret-1',
      },
      payload: { messages: [{ role: 'user', content: 'hello again' }] },
    });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toEqual({
      error: {
        code: 'FK-429',
        message: 'Too many requests.',
      },
    });
  });

  it('forwards chat requests to the runtime router', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const app = buildApp({
      apiKeys: [
        {
          id: 'chat',
          secret: 'chat-secret',
          permissions: ['chat'],
          tenants: ['tenant-a'],
        },
      ],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        'x-api-key': 'chat-secret',
      },
      payload: { messages: [{ role: 'user', content: 'hello' }] },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:4001/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
