import { describe, expect, it, vi } from 'vitest';
import type { FrasbergGateway } from '@frasberg/shared';
import { buildApp } from '../src/app';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function app() {
  const fetchImpl = vi.fn(async (url: URL | string) =>
    String(url).includes('/auth/v1/user')
      ? new Response(JSON.stringify({ id: USER_ID }), { status: 200 })
      : new Response('{}', { status: 200 }),
  ) as unknown as typeof fetch;
  return buildApp({
    apiKeys: [{ id: 'static', secret: 'static-secret', permissions: ['chat'] }],
    fetchImpl,
    frasbergGateway: {} as unknown as FrasbergGateway,
    supabaseUrl: 'https://supabase.test',
    supabaseAnonKey: 'anon',
  });
}

const user = { authorization: 'Bearer user-token' };

async function createKey(
  server: ReturnType<typeof app>,
  scopes: string[],
): Promise<{ key: string; record: { id: string } }> {
  const response = await server.inject({
    method: 'POST',
    url: '/v1/api-keys',
    headers: user,
    payload: { name: 'test key', scopes },
  });
  expect(response.statusCode).toBe(201);
  return response.json();
}

describe('luchii api keys on the gateway', () => {
  it('requires a signed-in user to manage keys', async () => {
    const server = app();
    const response = await server.inject({
      method: 'GET',
      url: '/v1/api-keys',
      headers: { authorization: 'Bearer static-secret' },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('PERMISSION_DENIED');
  });

  it('creates a key once, never exposing its hash on list', async () => {
    const server = app();
    const { key } = await createKey(server, ['chat.generate']);
    expect(key.startsWith('luc_live_')).toBe(true);

    const list = await server.inject({
      method: 'GET',
      url: '/v1/api-keys',
      headers: user,
    });
    expect(list.statusCode).toBe(200);
    expect(list.body).not.toContain('"hash"');
    expect(list.body).not.toContain(key);
    expect(list.json().keys).toHaveLength(1);
  });

  it('rejects unknown scopes', async () => {
    const response = await app().inject({
      method: 'POST',
      url: '/v1/api-keys',
      headers: user,
      payload: { name: 'x', scopes: ['root.everything'] },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_SCOPE');
  });

  it('returns key_not_found for an unknown luc_live key', async () => {
    const response = await app().inject({
      method: 'GET',
      url: '/v1/jobs/abc',
      headers: { authorization: 'Bearer luc_live_nope' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('KEY_NOT_FOUND');
  });

  it('returns PERMISSION_DENIED with the required scope', async () => {
    const server = app();
    const { key } = await createKey(server, ['music.generate']);
    const response = await server.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { authorization: `Bearer ${key}` },
      payload: { messages: [] },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error).toMatchObject({
      code: 'PERMISSION_DENIED',
      required: 'chat.generate',
    });
  });

  it('passes auth for a key holding the scope', async () => {
    const server = app();
    const { key } = await createKey(server, ['chat.generate']);
    const response = await server.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { 'x-api-key': key },
      payload: { messages: [] },
    });
    expect([401, 403]).not.toContain(response.statusCode);
  });

  it('rejects a disabled key with KEY_DISABLED', async () => {
    const server = app();
    const { key, record } = await createKey(server, ['chat.generate']);
    const del = await server.inject({
      method: 'DELETE',
      url: `/v1/api-keys/${record.id}`,
      headers: user,
    });
    expect(del.statusCode).toBe(200);

    const response = await server.inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { authorization: `Bearer ${key}` },
      payload: { messages: [] },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('KEY_DISABLED');
  });

  it('keeps existing static keys working', async () => {
    const response = await app().inject({
      method: 'POST',
      url: '/v1/chat/completions',
      headers: { authorization: 'Bearer static-secret' },
      payload: { messages: [] },
    });
    expect([401, 403]).not.toContain(response.statusCode);
  });

  it('does not let an API key mint keys', async () => {
    const server = app();
    const { key } = await createKey(server, ['chat.generate']);
    const response = await server.inject({
      method: 'POST',
      url: '/v1/api-keys',
      headers: { authorization: `Bearer ${key}` },
      payload: { name: 'x', scopes: ['chat.generate'] },
    });
    expect(response.statusCode).toBe(403);
  });
});
