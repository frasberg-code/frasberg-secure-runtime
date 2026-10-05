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

describe('emergent/gt6 routes', () => {
  it('returns 404 for an unknown race', async () => {
    const r = await app(['jobs:read']).inject({ method: 'GET', url: '/api/gt6/nope/broadcast', headers: auth });
    expect(r.statusCode).toBe(404);
  });
  it('denies without permission', async () => {
    const r = await app(['chat']).inject({ method: 'GET', url: '/api/gt6/nope/broadcast', headers: auth });
    expect(r.statusCode).toBe(403);
  });
});
