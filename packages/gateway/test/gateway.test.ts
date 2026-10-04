import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app';
import type { FrasbergGateway } from '@frasberg/shared';

const apiKeys = [
  {
    id: 'key-1',
    secret: 'secret-1',
    permissions: ['chat', 'jobs:read'] as const,
    tenants: ['tenant-a'],
  },
];

describe('gateway auth and routing', () => {
  it('serves the ALB health endpoint without authentication', async () => {
    const app = buildApp({
      apiKeys,
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const response = await app.inject({
      method: 'GET',
      url: '/runtime-health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

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

  it('routes /api/music through Frasberg gateway wrapper', async () => {
    const music = vi.fn(async () => ({ job_id: 'job-1', state: 'queued' }));
    const frasbergGateway = {
      music,
      video: vi.fn(),
      stt: vi.fn(),
      tts: vi.fn(),
      audio: vi.fn(),
      job: vi.fn(),
    } as unknown as FrasbergGateway;

    const app = buildApp({
      apiKeys: [
        {
          id: 'media',
          secret: 'media-secret',
          permissions: ['media'],
          tenants: ['tenant-a'],
        },
      ],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/music',
      headers: {
        'x-api-key': 'media-secret',
      },
      payload: { prompt: 'beat' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ job_id: 'job-1', state: 'queued' });
    expect(music).toHaveBeenCalledWith({ prompt: 'beat' });
  });

  it('applies a domain-specific burst quota by tenant', async () => {
    const music = vi.fn(async () => ({ job_id: 'job-1', state: 'queued' }));
    const frasbergGateway = {
      music,
      video: vi.fn(),
      stt: vi.fn(),
      tts: vi.fn(),
      audio: vi.fn(),
      job: vi.fn(),
    } as unknown as FrasbergGateway;
    const app = buildApp({
      apiKeys: [
        {
          id: 'media',
          secret: 'media-secret',
          permissions: ['media'],
          tenants: ['tenant-a'],
        },
      ],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway,
      apiQuotas: {
        music: { rpm: 1, burst: 1 },
      },
    });

    const request = {
      method: 'POST' as const,
      url: '/api/music',
      headers: { 'x-api-key': 'media-secret' },
      payload: { prompt: 'beat' },
    };
    expect((await app.inject(request)).statusCode).toBe(200);

    const limited = await app.inject(request);
    expect(limited.statusCode).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();
    expect(limited.json()).toEqual({
      error: {
        code: 'FK-429',
        message: 'Too many requests.',
      },
    });
    expect(music).toHaveBeenCalledTimes(1);
  });

  it('serves governance diagnostics only to governance administrators', async () => {
    const app = buildApp({
      apiKeys: [
        {
          id: 'governance-admin',
          secret: 'governance-secret',
          permissions: ['governance:admin'],
        },
      ],
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });

    const denied = await app.inject({
      method: 'GET',
      url: '/v1/governance/diagnostics',
    });
    expect(denied.statusCode).toBe(401);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/governance/diagnostics',
      headers: { 'x-api-key': 'governance-secret' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().status.status).toBe('ok');
  });

  it('accepts the dedicated governance admin key for governance routes only', async () => {
    const app = buildApp({
      governanceAdminKey: 'governance-test-key',
      apiKeys: [],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/governance/diagnostics',
      headers: { 'x-governance-key': 'governance-test-key' },
    });
    expect(response.statusCode).toBe(200);

    const denied = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { 'x-governance-key': 'governance-test-key' },
      payload: {},
    });
    expect(denied.statusCode).toBe(401);
  });

  it('rejects invalid governance admin keys', async () => {
    const app = buildApp({
      governanceAdminKey: 'governance-test-key',
      apiKeys: [],
    });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/governance/diagnostics',
      headers: { 'x-governance-key': 'invalid-key' },
    });
    expect(response.statusCode).toBe(401);
  });
});
