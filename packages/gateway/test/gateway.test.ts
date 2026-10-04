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

  it('rejects non-ASCII keys with a different byte length without throwing', async () => {
    const app = buildApp({
      governanceAdminKey: 'a',
      apiKeys: [],
    });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/governance/diagnostics',
      headers: { 'x-governance-key': 'é' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('loads the identity graph through the authenticated Supabase user', async () => {
    const accessToken = 'user-access-token';
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ node: [], edges: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/identity/graph',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ node: [], edges: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://project.supabase.co/auth/v1/user',
    );
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe(
      'https://project.supabase.co/rest/v1/rpc/rpc_get_identity_graph',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.headers).toMatchObject({
      apikey: 'anon-key',
      authorization: `Bearer ${accessToken}`,
    });
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe('{}');
  });

  it('writes the identity graph without accepting a client-supplied owner', async () => {
    const accessToken = 'user-access-token';
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ node: [{ id: 'n1' }], edges: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/v1/identity/graph',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        owner_id: '00000000-0000-4000-8000-000000000001',
        node: [{ id: 'n1' }],
        edges: [],
      },
    });

    expect(response.statusCode).toBe(200);
    const rpcCall = fetchImpl.mock.calls[1]?.[1];
    expect(rpcCall?.body).toBe(
      JSON.stringify({ p_node: [{ id: 'n1' }], p_edges: [] }),
    );
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_upsert_identity_graph',
    );
  });

  it('rejects invalid Supabase access tokens for identity endpoints', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: 'invalid token' }), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/identity/graph',
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(response.statusCode).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects identity graph payloads with non-array node or edges', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ id: 'de305d54-75b4-431b-adb2-eb6b9e546014' }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
    );
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'PUT',
      url: '/v1/identity/graph',
      headers: { authorization: 'Bearer valid-token' },
      payload: { node: {}, edges: [] },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('lists owner-scoped continuity events with a bounded page and opaque owner', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const worldId = 'a8098c1a-f86e-11da-bd1a-00112444be1e';
    const eventId = 'd9428888-122b-11e1-b85c-61cd3cbb3210';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify([
          {
            id: eventId,
            owner_id: userId,
            world_id: worldId,
            event_type: 'checkpoint',
            payload: { version: 1 },
            created_at: '2026-10-04T12:00:00.000Z',
          },
        ]),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/continuity/worlds/${worldId}/events?limit=1`,
      headers: { authorization: 'Bearer user-access-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      events: [
        {
          id: eventId,
          worldId,
          eventType: 'checkpoint',
          payload: { version: 1 },
          createdAt: '2026-10-04T12:00:00.000Z',
        },
      ],
      nextCursor: {
        before: '2026-10-04T12:00:00.000Z',
        beforeId: eventId,
      },
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_list_continuity_events_page',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        p_world_id: worldId,
        p_limit: 1,
        p_before: null,
        p_before_id: null,
      }),
    );
  });

  it('records continuity events without trusting owner IDs from the client', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const worldId = 'a8098c1a-f86e-11da-bd1a-00112444be1e';
    const eventId = 'd9428888-122b-11e1-b85c-61cd3cbb3210';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          id: eventId,
          owner_id: userId,
          world_id: worldId,
          event_type: 'checkpoint',
          payload: { version: 1 },
          created_at: '2026-10-04T12:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    });
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/v1/continuity/worlds/${worldId}/events`,
      headers: { authorization: 'Bearer user-access-token' },
      payload: {
        owner_id: '00000000-0000-4000-8000-000000000001',
        eventType: ' checkpoint ',
        payload: { version: 1 },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: eventId,
      worldId,
      eventType: 'checkpoint',
      payload: { version: 1 },
      createdAt: '2026-10-04T12:00:00.000Z',
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'record_continuity_event',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        p_world_id: worldId,
        p_event_type: 'checkpoint',
        p_payload: { version: 1 },
      }),
    );
  });

  it('rejects unbounded continuity event page sizes', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    );
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/continuity/worlds/a8098c1a-f86e-11da-bd1a-00112444be1e/events?limit=101',
      headers: { authorization: 'Bearer user-access-token' },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('loads continuity state through the owner-scoped RPC', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const worldId = 'a8098c1a-f86e-11da-bd1a-00112444be1e';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ version: 3 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/continuity/worlds/${worldId}/state`,
      headers: { authorization: 'Bearer user-access-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ version: 3 });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_get_continuity_state',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ p_world_id: worldId }),
    );
  });

  it('updates only continuity state and ignores client owner IDs', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const worldId = 'a8098c1a-f86e-11da-bd1a-00112444be1e';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ version: 4 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const app = buildApp({
      apiKeys,
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });

    const response = await app.inject({
      method: 'PUT',
      url: `/v1/continuity/worlds/${worldId}/state`,
      headers: { authorization: 'Bearer user-access-token' },
      payload: {
        owner_id: '00000000-0000-4000-8000-000000000001',
        state: { version: 4 },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ version: 4 });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_update_continuity_state',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ p_world_id: worldId, p_state: { version: 4 } }),
    );
  });
});
