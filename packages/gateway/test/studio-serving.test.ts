import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { FrasbergGateway } from '@frasberg/shared';
import { buildApp } from '../src/app';
import { DynamoRuntimeStateStore } from '../src/runtime-state-store';

describe('production Studio serving', () => {
  it('serves the SPA for browser routes while preserving JSON 404s for API paths', async () => {
    const app = buildApp({
      apiKeys: [{ id: 'studio-test', secret: 'studio-test-secret', permissions: ['jobs:read'] }],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway: {} as FrasbergGateway,
      runtimeStateStore: new DynamoRuntimeStateStore(''),
      studioRoot: resolve(__dirname, 'fixtures/studio'),
    });

    const root = await app.inject({
      method: 'GET',
      url: '/',
      headers: { accept: 'text/html', 'x-api-key': 'studio-test-secret' },
    });
    const route = await app.inject({
      method: 'GET',
      url: '/replay/race-1',
      headers: { accept: 'text/html', 'x-api-key': 'studio-test-secret' },
    });
    const api = await app.inject({
      method: 'GET',
      url: '/api/does-not-exist',
      headers: { accept: 'application/json', 'x-api-key': 'studio-test-secret' },
    });

    expect(root.statusCode).toBe(200);
    expect(root.body).toContain('Studio fixture');
    expect(route.statusCode).toBe(200);
    expect(route.body).toContain('Studio fixture');
    expect(api.statusCode).toBe(404);
    expect(api.json()).toEqual({ error: 'Not Found' });
    await app.close();
  });
});
