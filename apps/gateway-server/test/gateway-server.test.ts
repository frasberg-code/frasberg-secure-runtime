import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  buildGatewayServerApp,
  InMemoryAuditStore,
  InMemoryRoleStore,
  type EngineAdapter,
} from '../src/app';

const jwtConfig = {
  secret: 'test-secret',
  issuer: 'frasberg-runtime',
  audience: 'frasberg-gateway',
};

describe('gateway-server security', () => {
  it('rejects missing token', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/generate/music',
      payload: { prompt: 'hello' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects invalid token signature', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/generate/music',
      headers: {
        authorization: authHeader(
          signToken(
            {
              sub: 'admin-user',
              iss: jwtConfig.issuer,
              aud: jwtConfig.audience,
              exp: futureExp(),
            },
            'wrong-secret',
          ),
        ),
      },
      payload: { prompt: 'hello' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects expired token', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/generate/music',
      headers: {
        authorization: authHeader(
          signToken({
            sub: 'admin-user',
            iss: jwtConfig.issuer,
            aud: jwtConfig.audience,
            exp: Math.floor(Date.now() / 1000) - 60,
          }),
        ),
      },
      payload: { prompt: 'hello' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects non-admin on admin route', async () => {
    const app = testApp({
      roles: { 'regular-user': 'user' },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/admin/control/run-cycle',
      headers: { authorization: bearerFor('regular-user') },
    });
    expect(response.statusCode).toBe(403);
  });

  it('rejects invalid request body', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/generate/music',
      headers: { authorization: bearerFor('admin-user') },
      payload: { prompt: '' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('submits generate requests through injected engine adapter', async () => {
    const adapter: EngineAdapter = {
      submitJob: vi.fn(async () => ({
        jobId: 'job-1',
        domain: 'music',
        state: 'queued',
      })),
    };
    const app = testApp({ adapter });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/generate/music',
      headers: { authorization: bearerFor('admin-user') },
      payload: { prompt: 'create a beat' },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({
      jobId: 'job-1',
      domain: 'music',
      state: 'queued',
    });
    expect(adapter.submitJob).toHaveBeenCalledWith('music', {
      prompt: 'create a beat',
      eid: undefined,
    });
  });

  it('registers and updates policies through admin endpoints', async () => {
    const app = testApp();
    const created = await app.inject({
      method: 'POST',
      url: '/v1/admin/policy/register',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        name: 'baseline',
        meaningThreshold: 0.2,
        riskThreshold: 0.3,
      },
    });
    const policy = created.json() as { id: string };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/admin/policy/update/${policy.id}`,
      headers: { authorization: bearerFor('admin-user') },
      payload: { riskThreshold: 0.7 },
    });

    expect(created.statusCode).toBe(201);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ riskThreshold: 0.7 });
  });

  it('returns error for governance policy update failures', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/admin/policy/update/missing',
      headers: { authorization: bearerFor('admin-user') },
      payload: { riskThreshold: 2 },
    });

    expect(response.statusCode).toBe(400);
  });

  it('uses trusted role lookup for admin success and rejects client-claimed roles', async () => {
    const app = testApp({
      roles: {
        'admin-user': 'admin',
        'token-admin': 'user',
      },
    });

    const rejected = await app.inject({
      method: 'GET',
      url: '/v1/admin/control/status',
      headers: {
        authorization: authHeader(
          signToken({
            sub: 'token-admin',
            role: 'admin',
            iss: jwtConfig.issuer,
            aud: jwtConfig.audience,
            exp: futureExp(),
          }),
        ),
      },
    });
    expect(rejected.statusCode).toBe(403);

    const accepted = await app.inject({
      method: 'GET',
      url: '/v1/admin/control/status',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(accepted.statusCode).toBe(200);
    expect(accepted.json()).toMatchObject({ status: 'ok' });
  });

  it('validates admin world registration and creates audit records with pagination', async () => {
    const auditStore = new InMemoryAuditStore();
    const app = testApp({ auditStore });

    const invalid = await app.inject({
      method: 'POST',
      url: '/v1/admin/worlds/register',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        label: 'Broken',
        eid: 'eid-broken',
        existenceState: 'unstable',
        continuityArc: 'arc-broken',
        meaningScore: 2,
        riskProfile: 0.3,
        tags: ['broken'],
      },
    });
    expect(invalid.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: '/v1/admin/worlds/register',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        id: 'world-a',
        label: 'World A',
        eid: 'eid-a',
        existenceState: 'stable',
        continuityArc: 'arc-a',
        meaningScore: 0.4,
        riskProfile: 0.2,
        tags: ['alpha'],
      },
    });
    expect(created.statusCode).toBe(201);

    const simulation = await app.inject({
      method: 'POST',
      url: '/v1/admin/continuity/simulate',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        worldId: 'world-a',
        prompt: 'simulate arc shift',
        steps: 2,
      },
    });
    expect(simulation.statusCode).toBe(200);

    const diagnostics = await app.inject({
      method: 'GET',
      url: '/v1/admin/diagnostics',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(diagnostics.statusCode).toBe(200);
    expect(diagnostics.json()).toMatchObject({
      status: { worldCount: 1 },
    });

    const auditPage = await app.inject({
      method: 'GET',
      url: '/v1/admin/audit?limit=1&offset=0',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(auditPage.statusCode).toBe(200);
    expect(auditPage.json()).toMatchObject({
      records: [expect.objectContaining({ action: 'world:register' })],
      limit: 1,
      offset: 0,
      total: 2,
      nextOffset: 1,
    });
  });

  it('deletes registered worlds and returns 404 for missing worlds', async () => {
    const app = testApp();

    await app.inject({
      method: 'POST',
      url: '/v1/admin/worlds/register',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        id: 'world-delete',
        label: 'World Delete',
        eid: 'eid-delete',
        existenceState: 'stable',
        continuityArc: 'arc-delete',
        meaningScore: 0.5,
        riskProfile: 0.1,
        tags: ['delete'],
      },
    });

    const deleted = await app.inject({
      method: 'DELETE',
      url: '/v1/admin/worlds/world-delete',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(deleted.statusCode).toBe(200);
    expect(deleted.json()).toMatchObject({
      deleted: true,
      world: { id: 'world-delete' },
    });

    const missing = await app.inject({
      method: 'DELETE',
      url: '/v1/admin/worlds/missing-world',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(missing.statusCode).toBe(404);
  });

  it('creates audit records for control cycles', async () => {
    const auditStore = new InMemoryAuditStore();
    const app = testApp({ auditStore });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/admin/control/run-cycle',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(response.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/v1/admin/audit',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(listResponse.statusCode).toBe(200);
    const payload = listResponse.json() as { records: { action: string }[] };
    expect(
      payload.records.some((record) => record.action === 'control-cycle:run'),
    ).toBe(true);
  });
});

function testApp(
  options: {
    adapter?: EngineAdapter;
    roles?: Record<string, 'admin' | 'user'>;
    auditStore?: InMemoryAuditStore;
  } = {},
) {
  return buildGatewayServerApp({
    jwt: jwtConfig,
    roleStore: new InMemoryRoleStore(
      options.roles ?? {
        'admin-user': 'admin',
      },
    ),
    engineAdapter:
      options.adapter ??
      ({
        submitJob: async () => ({
          jobId: 'job-default',
          domain: 'music',
          state: 'queued',
        }),
      } as EngineAdapter),
    auditStore: options.auditStore,
  });
}

function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 60;
}

function authHeader(token: string): string {
  return ['Bearer', token].join(' ');
}

function bearerFor(sub: string): string {
  return authHeader(
    signToken({
      sub,
      iss: jwtConfig.issuer,
      aud: jwtConfig.audience,
      exp: futureExp(),
    }),
  );
}

function signToken(
  payload: Record<string, unknown>,
  secret = jwtConfig.secret,
): string {
  const headerSegment = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payloadSegment = base64UrlEncode(payload);
  const signature = createHmac('sha256', secret)
    .update(`${headerSegment}.${payloadSegment}`)
    .digest('base64url');

  return `${headerSegment}.${payloadSegment}.${signature}`;
}

function base64UrlEncode(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}
