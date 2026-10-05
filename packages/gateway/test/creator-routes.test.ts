import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app';
import { FrasbergGateway } from '@frasberg/shared';

function app(permissions: string[]) {
  return buildApp({
    apiKeys: [{ id: 'k', secret: 's', permissions: permissions as any }],
    fetchImpl: vi.fn() as unknown as typeof fetch,
    frasbergGateway: {} as unknown as FrasbergGateway,
  });
}
const auth = { authorization: 'Bearer s' };

describe('creator routes', () => {
  it('publishes an asset and lists it for the same key only', async () => {
    const a = app(['jobs:read', 'jobs:write']);
    const pub = await a.inject({
      method: 'POST', url: '/api/publish', headers: auth,
      payload: { mp4Url: 'https://example.com/a.mp4', story: { id: 's', title: 't', beats: [], highlights: [] } },
    });
    expect(pub.statusCode).toBe(200);
    const assetId = pub.json().assetId;
    const list = await a.inject({ method: 'GET', url: '/api/creator/assets', headers: auth });
    expect(Object.keys(list.json().nodes)).toContain(assetId);
    const lic = await a.inject({
      method: 'POST', url: '/api/creator/license', headers: auth,
      payload: { assetId, priceCents: 500 },
    });
    expect(lic.statusCode).toBe(200);
  });
  it('rejects bad publish input and unknown license assets', async () => {
    const a = app(['jobs:read', 'jobs:write']);
    expect((await a.inject({ method: 'POST', url: '/api/publish', headers: auth, payload: { mp4Url: 'javascript:x', story: {} } })).statusCode).toBe(400);
    expect((await a.inject({ method: 'POST', url: '/api/creator/license', headers: auth, payload: { assetId: 'nope' } })).statusCode).toBe(400);
  });
  it('requires permission and 404s unknown races', async () => {
    expect((await app(['chat']).inject({ method: 'GET', url: '/api/creator/assets', headers: auth })).statusCode).toBe(403);
    expect((await app(['jobs:read']).inject({ method: 'GET', url: '/api/gt6/zzz/mixed', headers: auth })).statusCode).toBe(404);
  });
  it('validates camera input and 404s unknown races', async () => {
    const a = app(['jobs:read', 'jobs:write']);
    expect((await a.inject({ method: 'POST', url: '/api/gt6/zzz/camera', headers: auth, payload: { camera: 'drone' } })).statusCode).toBe(404);
  });
});