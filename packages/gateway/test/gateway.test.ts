import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app';
import { FrasbergClient, FrasbergGateway } from '@frasberg/shared';

const apiKeys = [
  {
    id: 'key-1',
    secret: 'secret-1',
    permissions: ['chat', 'jobs:read'] as const,
    tenants: ['tenant-a'],
  },
];

describe('gateway auth and routing', () => {
  it('forwards uploaded audio as multipart for the provider STT endpoint', async () => {
    const stt = vi.fn(async (payload: FormData) => ({
      forwarded: payload instanceof FormData,
    }));
    const app = buildApp({
      apiKeys: [{ id: 'stt', secret: 'stt-secret', permissions: ['stt'] }],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway: {
        music: vi.fn(),
        video: vi.fn(),
        image: vi.fn(),
        voice: vi.fn(),
        stt,
        tts: vi.fn(),
        audio: vi.fn(),
        job: vi.fn(),
      } as unknown as FrasbergGateway,
    });
    const boundary = 'stt-test-boundary';
    const audioPayload = Buffer.from(
      `--${boundary}\r\n` +
        'Content-Disposition: form-data; name="file"; filename="test.wav"\r\n' +
        'Content-Type: audio/wav\r\n\r\n' +
        'test audio\r\n' +
        `--${boundary}--\r\n`,
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/stt',
      headers: {
        'x-api-key': 'stt-secret',
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      payload: audioPayload,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ forwarded: true });
    expect(stt).toHaveBeenCalledOnce();
    const form = stt.mock.calls[0]?.[0];
    expect(form?.get('file')).toBeInstanceOf(Blob);
  });

  it('requires a multipart audio file for STT requests', async () => {
    const stt = vi.fn();
    const app = buildApp({
      apiKeys: [{ id: 'stt', secret: 'stt-secret', permissions: ['stt'] }],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway: {
        music: vi.fn(),
        video: vi.fn(),
        image: vi.fn(),
        voice: vi.fn(),
        stt,
        tts: vi.fn(),
        audio: vi.fn(),
        job: vi.fn(),
      } as unknown as FrasbergGateway,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/stt',
      headers: { 'x-api-key': 'stt-secret' },
      payload: { text: 'not audio' },
    });

    expect(response.statusCode).toBe(400);
    expect(stt).not.toHaveBeenCalled();
  });

  it('executes each engine through the authenticated API gateway', async () => {
    const app = buildApp({
      apiKeys: [
        { id: 'engine', secret: 'engine-secret', permissions: ['chat'] },
      ],
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const domains = [
      'identity',
      'persona',
      'character',
      'role',
      'function',
      'task',
      'action',
      'behavior',
      'pattern',
      'structure',
    ] as const;

    for (const domain of domains) {
      const input = `hello ${domain}`;
      const payload = { input, awareness: createEngineAwareness() };
      const signature = createHmac('sha256', 'engine-secret')
        .update(JSON.stringify(payload))
        .digest('hex');
      const response = await app.inject({
        method: 'POST',
        url: `/v1/${domain}`,
        headers: {
          'x-api-key': 'engine-secret',
          'x-api-signature': signature,
        },
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().payload.output).toBe(
        `${domain[0].toUpperCase()}${domain.slice(1)} processed: ${input}`,
      );
    }
  });

  it('rejects engine requests without awareness', async () => {
    const app = buildApp({
      apiKeys: [
        { id: 'engine', secret: 'engine-secret', permissions: ['chat'] },
      ],
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });
    const payload = { input: 'hello identity' };
    const signature = createHmac('sha256', 'engine-secret')
      .update(JSON.stringify(payload))
      .digest('hex');
    const response = await app.inject({
      method: 'POST',
      url: '/v1/identity',
      headers: {
        'x-api-key': 'engine-secret',
        'x-api-signature': signature,
      },
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Request must include a string input and valid awareness.',
    });
  });

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

  it('verifies a body signature for signed API requests', async () => {
    const app = buildApp({
      apiKeys: [{ id: 'chat', secret: 'chat-secret', permissions: ['chat'] }],
      fetchImpl: vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ) as unknown as typeof fetch,
    });
    const payload = { messages: [{ role: 'user', content: 'hello' }] };
    const signature = createHmac('sha256', 'chat-secret')
      .update(JSON.stringify(payload))
      .digest('hex');

    const accepted = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        'x-api-key': 'chat-secret',
        'x-api-signature': signature,
      },
      payload,
    });
    const rejected = await app.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: {
        'x-api-key': 'chat-secret',
        'x-api-signature': '0'.repeat(64),
      },
      payload,
    });

    expect(accepted.statusCode).toBe(200);
    expect(rejected.statusCode).toBe(403);
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

  it('routes image and voice generation through their authenticated domains', async () => {
    const image = vi.fn(async () => ({ job_id: 'image-1', state: 'queued' }));
    const voice = vi.fn(async () => ({ job_id: 'voice-1', state: 'queued' }));
    const app = buildApp({
      apiKeys: [
        {
          id: 'studio',
          secret: 'studio-secret',
          permissions: ['media'],
          tenants: ['tenant-a'],
        },
      ],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway: {
        music: vi.fn(),
        video: vi.fn(),
        image,
        voice,
        stt: vi.fn(),
        tts: vi.fn(),
        audio: vi.fn(),
        job: vi.fn(),
      } as unknown as FrasbergGateway,
    });

    const imageResponse = await app.inject({
      method: 'POST',
      url: '/api/image',
      headers: { 'x-api-key': 'studio-secret' },
      payload: { prompt: 'mountains at sunset' },
    });
    const voiceResponse = await app.inject({
      method: 'POST',
      url: '/api/voice',
      headers: { 'x-api-key': 'studio-secret' },
      payload: { prompt: 'welcome message' },
    });

    expect(imageResponse.statusCode).toBe(200);
    expect(imageResponse.json().job_id).toBe('image-1');
    expect(voiceResponse.statusCode).toBe(200);
    expect(voiceResponse.json().job_id).toBe('voice-1');
    expect(image).toHaveBeenCalledWith({ prompt: 'mountains at sunset' });
    expect(voice).toHaveBeenCalledWith({ prompt: 'welcome message' });
  });

  it('verifies Supabase sessions and forwards them for image generation and polling', async () => {
    const accessToken = 'verified-supabase-session';
    const userId = '4b682ba7-921a-4d02-aad8-3b210a7561af';
    const imageForUser = vi.fn(async () => ({
      job_id: 'image-user-1',
      state: 'queued',
    }));
    const job = vi.fn(async () => ({ id: 'image-user-1', state: 'completed' }));
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('https://supabase.test/auth/v1/user');
      return new Response(JSON.stringify({ id: userId }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    const app = buildApp({
      apiKeys: [],
      fetchImpl: fetchImpl as typeof fetch,
      supabaseUrl: 'https://supabase.test',
      supabaseAnonKey: 'supabase-anon-key',
      frasbergGateway: {
        imageForUser,
        job,
      } as unknown as FrasbergGateway,
    });

    const image = await app.inject({
      method: 'POST',
      url: '/api/image',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { prompt: 'a track at sunset' },
    });
    const polled = await app.inject({
      method: 'GET',
      url: '/api/jobs/image-user-1?domain=image',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(image.statusCode).toBe(200);
    expect(imageForUser).toHaveBeenCalledWith(
      { prompt: 'a track at sunset' },
      accessToken,
    );
    expect(polled.statusCode).toBe(200);
    expect(job).toHaveBeenCalledWith('image-user-1', {
      domain: 'image',
      accessToken,
    });
    await app.close();
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

  it('serves provider status only to governance administrators without submitting jobs', async () => {
    const providerFetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('authorization');
      return new Response('{}', { status: auth ? 200 : 405 });
    });
    const app = buildApp({
      apiKeys: [
        {
          id: 'governance-admin',
          secret: 'governance-secret',
          permissions: ['governance:admin'],
        },
        { id: 'plain', secret: 'plain-secret', permissions: ['chat'] },
      ],
      frasbergGateway: new FrasbergGateway(
        new FrasbergClient({
          fetchImpl: providerFetch as unknown as typeof fetch,
        }),
        { FRASBERG_TTS_KEY: 'tts-secret-value' },
      ),
      fetchImpl: vi.fn() as unknown as typeof fetch,
    });

    expect(
      (await app.inject({ method: 'GET', url: '/v1/providers/status' }))
        .statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/v1/providers/status',
          headers: { 'x-api-key': 'plain-secret' },
        })
      ).statusCode,
    ).toBe(403);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/providers/status',
      headers: { 'x-api-key': 'governance-secret' },
    });
    expect(response.statusCode).toBe(200);
    const tts = response
      .json()
      .providers.find((p: { domain: string }) => p.domain === 'tts');
    expect(tts).toMatchObject({
      keyConfigured: true,
      keyAccepted: true,
      reachable: true,
    });
    const music = response
      .json()
      .providers.find((p: { domain: string }) => p.domain === 'music');
    expect(music.keyConfigured).toBe(false);
    expect(response.body).not.toContain('tts-secret-value');
    for (const [, init] of providerFetch.mock.calls) {
      expect(init?.method).toBe('GET');
    }
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

  it('records diagnostics for the verified user and strips owner IDs', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
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
          event_type: 'runtime.warning',
          severity: 'warning',
          details: { code: 'retrying' },
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
      url: '/v1/diagnostics',
      headers: { authorization: 'Bearer user-access-token' },
      payload: {
        owner_id: '00000000-0000-4000-8000-000000000001',
        eventType: ' runtime.warning ',
        severity: 'warning',
        details: { code: 'retrying' },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: eventId,
      eventType: 'runtime.warning',
      severity: 'warning',
      details: { code: 'retrying' },
      createdAt: '2026-10-04T12:00:00.000Z',
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_record_diagnostic_event',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        p_event_type: 'runtime.warning',
        p_severity: 'warning',
        p_details: { code: 'retrying' },
      }),
    );
  });

  it('lists only sanitized, paginated diagnostic events', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
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
            event_type: 'runtime.warning',
            severity: 'warning',
            details: { code: 'retrying' },
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
      url: '/v1/diagnostics?limit=1',
      headers: { authorization: 'Bearer user-access-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      events: [
        {
          id: eventId,
          eventType: 'runtime.warning',
          severity: 'warning',
          details: { code: 'retrying' },
          createdAt: '2026-10-04T12:00:00.000Z',
        },
      ],
      nextCursor: {
        before: '2026-10-04T12:00:00.000Z',
        beforeId: eventId,
      },
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_list_diagnostic_events',
    );
  });

  it('rejects unsupported diagnostic severities', async () => {
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
      method: 'POST',
      url: '/v1/diagnostics',
      headers: { authorization: 'Bearer user-access-token' },
      payload: {
        eventType: 'runtime.warning',
        severity: 'debug',
        details: {},
      },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('creates owner-scoped governance policies without a client owner ID', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const policyId = 'd9428888-122b-11e1-b85c-61cd3cbb3210';
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(
        JSON.stringify({
          id: policyId,
          owner_id: userId,
          name: 'safe-runtime',
          meaning_threshold: 0.6,
          risk_threshold: 0.4,
          enabled: true,
          updated_at: '2026-10-04T12:00:00.000Z',
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
      method: 'PUT',
      url: '/v1/policy',
      headers: { authorization: 'Bearer user-access-token' },
      payload: {
        owner_id: '00000000-0000-4000-8000-000000000001',
        name: ' safe-runtime ',
        meaningThreshold: 0.6,
        riskThreshold: 0.4,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: policyId,
      name: 'safe-runtime',
      meaningThreshold: 0.6,
      riskThreshold: 0.4,
      enabled: true,
      updatedAt: '2026-10-04T12:00:00.000Z',
    });
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_upsert_user_policy',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        p_id: null,
        p_name: 'safe-runtime',
        p_meaning_threshold: 0.6,
        p_risk_threshold: 0.4,
        p_enabled: true,
      }),
    );
  });

  it('evaluates policies using the verified Supabase user token', async () => {
    const userId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const decision = {
      allowed: false,
      policiesEvaluated: 1,
      violations: [
        {
          policyId: 'd9428888-122b-11e1-b85c-61cd3cbb3210',
          name: 'safe-runtime',
          violations: ['risk-above-threshold'],
        },
      ],
    };
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: userId }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(decision), {
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
      method: 'POST',
      url: '/v1/policy/enforce',
      headers: { authorization: 'Bearer user-access-token' },
      payload: { meaningScore: 0.8, riskProfile: 0.7 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(decision);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toContain(
      'rpc_enforce_user_policies',
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ p_meaning_score: 0.8, p_risk_profile: 0.7 }),
    );
  });

  it('rejects invalid policy thresholds before calling storage', async () => {
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
      method: 'PUT',
      url: '/v1/policy',
      headers: { authorization: 'Bearer user-access-token' },
      payload: {
        name: 'invalid',
        meaningThreshold: 1.1,
        riskThreshold: 0.4,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

function createEngineAwareness() {
  const path = [
    'consciousnessPerception',
    'mindAwareness',
    'cognitiveMindspace',
    'reasoningArchitecture',
    'logicCognition',
    'designReasoning',
    'blueprintLogic',
    'architecturePlan',
    'structureBlueprint',
    'patternArchitecture',
    'exchangeStructure',
    'interactionFlow',
    'influenceExchange',
    'fieldPropagation',
    'vectorInfluence',
    'forceDirection',
    'dynamicsVector',
    'motionForce',
    'travelKinetics',
    'navigationMotion',
    'routeDecision',
    'pathNavigation',
    'directionMap',
    'pathwayDirection',
  ];
  let perception: Record<string, any> = { structuralPathway: 'open' };

  for (const key of path.reverse()) {
    perception = { [key]: perception };
  }

  return {
    perception,
    field: { harmonyAwarenessField: 'balanced' },
  };
}
