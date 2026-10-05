import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app';
import { DynamoRuntimeStateStore } from '../src/runtime-state-store';
import { FrasbergGateway } from '@frasberg/shared';

describe('release routes', () => {
  it('lists GitHub releases from the public repository endpoint', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify([{
          tag_name: 'v0.2.0',
          name: '0.2.0',
          published_at: '2026-10-05T00:00:00Z',
          body: 'notes',
          html_url: 'https://github.com/frasberg-code/frasberg-secure-runtime/releases/tag/v0.2.0',
          draft: false,
          prerelease: false,
        }]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ) as unknown as typeof fetch;
    const app = buildApp({
      apiKeys: [{ id: 'reader', secret: 'reader-key', permissions: ['jobs:read'] }],
      fetchImpl,
      frasbergGateway: {} as FrasbergGateway,
      runtimeStateStore: new DynamoRuntimeStateStore(''),
    });
    const response = await app.inject({
      method: 'GET',
      url: '/api/releases',
      headers: { authorization: 'Bearer reader-key' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()[0].tagName).toBe('v0.2.0');
    await app.close();
  });

  it('returns an explicit unavailable response when release credentials are missing', async () => {
    const previous = process.env.GITHUB_RELEASE_TOKEN;
    delete process.env.GITHUB_RELEASE_TOKEN;
    try {
      const app = buildApp({
        apiKeys: [{ id: 'admin', secret: 'admin-key', permissions: ['governance:admin'] }],
        fetchImpl: vi.fn() as unknown as typeof fetch,
        frasbergGateway: {} as FrasbergGateway,
        runtimeStateStore: new DynamoRuntimeStateStore(''),
      });
      const response = await app.inject({
        method: 'POST',
        url: '/api/releases/new',
        headers: { authorization: 'Bearer admin-key' },
        payload: { version: 'v1.0.0', notes: 'notes' },
      });
      expect(response.statusCode).toBe(503);
      expect(response.json().error).toMatch(/GITHUB_RELEASE_TOKEN/);
      await app.close();
    } finally {
      if (previous !== undefined) process.env.GITHUB_RELEASE_TOKEN = previous;
    }
  });
});
