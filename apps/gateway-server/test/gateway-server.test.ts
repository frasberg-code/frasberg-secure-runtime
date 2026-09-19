import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  validateWorldDefinition,
  type WorldDefinition,
} from '@frasberg/full-game-stack-schema';
import type {
  WorldGraphDefinitionRecord,
  WorldGraphListPage,
  WorldGraphRequestContext,
  WorldGraphService,
} from '@frasberg/worldgraph-engine';
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

  it('rejects worldgraph requests without auth', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/worldgraph',
      payload: baseWorldDefinition(),
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects invalid worldgraph schema payloads', async () => {
    const app = testApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/worldgraph',
      headers: { authorization: bearerFor('admin-user') },
      payload: {
        ...baseWorldDefinition(),
        metadata: { schemaVersion: '', tags: [] },
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('scopes worldgraph definitions to the authenticated owner', async () => {
    const app = testApp({
      roles: {
        'owner-user': 'user',
        'other-user': 'user',
      },
    });
    const created = await app.inject({
      method: 'POST',
      url: '/v1/worldgraph',
      headers: { authorization: bearerFor('owner-user') },
      payload: baseWorldDefinition(),
    });
    const record = created.json() as WorldGraphDefinitionRecord;

    const foreignRead = await app.inject({
      method: 'GET',
      url: `/v1/worldgraph/${record.id}`,
      headers: { authorization: bearerFor('other-user') },
    });
    const foreignList = await app.inject({
      method: 'GET',
      url: '/v1/worldgraph',
      headers: { authorization: bearerFor('other-user') },
    });

    expect(foreignRead.statusCode).toBe(404);
    expect((foreignList.json() as WorldGraphListPage).items).toEqual([]);
  });

  it('creates, lists, updates, and deletes worldgraph definitions with audit records', async () => {
    const auditStore = new InMemoryAuditStore();
    const app = testApp({ auditStore });

    const createResponse = await app.inject({
      method: 'POST',
      url: '/v1/worldgraph',
      headers: { authorization: bearerFor('admin-user') },
      payload: baseWorldDefinition(),
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json() as WorldGraphDefinitionRecord;

    const listResponse = await app.inject({
      method: 'GET',
      url: '/v1/worldgraph?page=1&pageSize=10',
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
    });

    const updatedDefinition = {
      ...baseWorldDefinition(),
      name: 'Updated GT Demo',
    };
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/v1/worldgraph/${created.id}`,
      headers: { authorization: bearerFor('admin-user') },
      payload: updatedDefinition,
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({ name: 'Updated GT Demo' });

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/v1/worldgraph/${created.id}`,
      headers: { authorization: bearerFor('admin-user') },
    });
    expect(deleteResponse.statusCode).toBe(204);

    const auditResponse = await app.inject({
      method: 'GET',
      url: '/v1/admin/audit',
      headers: { authorization: bearerFor('admin-user') },
    });
    const auditPayload = auditResponse.json() as { records: { action: string }[] };
    expect(auditPayload.records.map((record) => record.action)).toEqual(
      expect.arrayContaining([
        'worldgraph:create',
        'worldgraph:update',
        'worldgraph:delete',
      ]),
    );
  });
});

function testApp(
  options: {
    adapter?: EngineAdapter;
    roles?: Record<string, 'admin' | 'user'>;
    auditStore?: InMemoryAuditStore;
    worldGraphService?: WorldGraphService;
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
    worldGraphService:
      options.worldGraphService ?? new InMemoryWorldGraphService(),
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

function baseWorldDefinition(): WorldDefinition {
  return {
    id: 'world-1',
    name: 'GT Demo',
    kind: 'game',
    metadata: {
      schemaVersion: '1.0.0',
      tags: ['phase-1'],
    },
    scenes: [],
    pages: [],
    screens: [],
    flows: [],
    routes: [],
    vehicleClasses: [],
  };
}

class InMemoryWorldGraphService implements WorldGraphService {
  private readonly records = new Map<string, WorldGraphDefinitionRecord>();
  private nextId = 1;

  async createDefinition(
    context: WorldGraphRequestContext,
    definition: unknown,
  ): Promise<WorldGraphDefinitionRecord> {
    const validatedDefinition = validateWorldDefinition(definition);
    const id = `wg-${this.nextId++}`;
    const now = new Date().toISOString();
    const record: WorldGraphDefinitionRecord = {
      id,
      ownerId: context.ownerId,
      kind: validatedDefinition.kind,
      name: validatedDefinition.name,
      schemaVersion: validatedDefinition.metadata.schemaVersion,
      definition: validatedDefinition,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(id, copyRecord(record));
    return copyRecord(record);
  }

  async getDefinition(
    context: WorldGraphRequestContext,
    id: string,
  ): Promise<WorldGraphDefinitionRecord | undefined> {
    const record = this.records.get(id);
    if (!record || record.ownerId !== context.ownerId) {
      return undefined;
    }
    return copyRecord(record);
  }

  async updateDefinition(
    context: WorldGraphRequestContext,
    id: string,
    definition: unknown,
  ): Promise<WorldGraphDefinitionRecord | undefined> {
    const current = await this.getDefinition(context, id);
    if (!current) {
      return undefined;
    }

    const validatedDefinition = validateWorldDefinition(definition);
    const updated: WorldGraphDefinitionRecord = {
      ...current,
      kind: validatedDefinition.kind,
      name: validatedDefinition.name,
      schemaVersion: validatedDefinition.metadata.schemaVersion,
      definition: validatedDefinition,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(id, copyRecord(updated));
    return copyRecord(updated);
  }

  async deleteDefinition(
    context: WorldGraphRequestContext,
    id: string,
  ): Promise<boolean> {
    const current = await this.getDefinition(context, id);
    if (!current) {
      return false;
    }
    this.records.delete(id);
    return true;
  }

  async listDefinitions(
    context: WorldGraphRequestContext,
    options = {},
  ): Promise<WorldGraphListPage> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const items = [...this.records.values()]
      .filter((record) => record.ownerId === context.ownerId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice((page - 1) * pageSize, page * pageSize)
      .map(copyRecord);
    const total = [...this.records.values()].filter(
      (record) => record.ownerId === context.ownerId,
    ).length;
    return { items, page, pageSize, total };
  }
}

function copyRecord(
  record: WorldGraphDefinitionRecord,
): WorldGraphDefinitionRecord {
  return {
    ...record,
    definition: validateWorldDefinition(record.definition),
  };
}
