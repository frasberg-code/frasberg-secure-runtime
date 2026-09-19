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
      url: '/v1/admin/control-cycle',
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

  it('updates governance policy thresholds through governance engine API', async () => {
    const app = testApp();
    const created = await app.inject({
      method: 'POST',
      url: '/v1/admin/governance/policies',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        name: 'baseline',
        meaningThreshold: 0.2,
        riskThreshold: 0.3,
      },
    });
    const policy = created.json() as { id: string };

    const response = await app.inject({
      method: 'PATCH',
      url: `/v1/admin/governance/policies/${policy.id}`,
      headers: { authorization: bearerFor('admin-user') },
      payload: { riskThreshold: 0.7 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ riskThreshold: 0.7 });
  });

  it('returns error for governance policy update failures', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/admin/governance/policies/missing',
      headers: { authorization: bearerFor('admin-user') },
      payload: { riskThreshold: 2 },
    });

    expect(response.statusCode).toBe(400);
  });

  it('creates audit records for admin mutations', async () => {
    const auditStore = new InMemoryAuditStore();
    const app = testApp({ auditStore });

    await app.inject({
      method: 'POST',
      url: '/v1/admin/control-cycle',
      headers: { authorization: bearerFor('admin-user') },
    });

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
