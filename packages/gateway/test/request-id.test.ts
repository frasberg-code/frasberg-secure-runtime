import { describe, expect, it, vi } from 'vitest';
import { FrasbergGateway } from '@frasberg/shared';
import { buildApp } from '../src/app';
import { DynamoRuntimeStateStore } from '../src/runtime-state-store';

describe('gateway request ids', () => {
  const make = () =>
    buildApp({
      apiKeys: [{ id: 'k', secret: 'secret', permissions: ['jobs:read'] }],
      fetchImpl: vi.fn() as unknown as typeof fetch,
      frasbergGateway: {} as FrasbergGateway,
      runtimeStateStore: new DynamoRuntimeStateStore(''),
    });

  it('replaces malformed inbound ids with req_<uuid>', async () => {
    const app = make();
    const res = await app.inject({ method: 'GET', url: '/v1/jobs/x', headers: { 'x-request-id': '../../etc/passwd' } });
    expect(res.headers['x-request-id']).toMatch(/^req_[a-zA-Z0-9_-]{8,128}$/);
    expect(res.headers['x-request-id']).not.toContain('passwd');
    await app.close();
  });

  it('propagates valid inbound ids', async () => {
    const app = make();
    const res = await app.inject({ method: 'GET', url: '/v1/jobs/x', headers: { 'x-request-id': 'req_external_123' } });
    expect(res.headers['x-request-id']).toBe('req_external_123');
    await app.close();
  });
});
