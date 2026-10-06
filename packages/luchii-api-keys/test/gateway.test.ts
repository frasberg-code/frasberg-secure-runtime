import { beforeEach, describe, expect, it } from 'vitest';
import {
  InMemoryApiKeyStore,
  apiKeyMiddleware,
  configureApiKeyStore,
  createApiKey,
  hashApiKey,
  requirePermission,
  type HttpRequest,
} from '../src';
import { rateLimit } from '../../luchii-rate-limiter/src';

function mockRes() {
  const out: { status?: number; body?: any } = {};
  const res: any = {
    status(code: number) {
      out.status = code;
      return res;
    },
    json(body: unknown) {
      out.body = body;
      return res;
    },
  };
  return { res, out };
}

// Runs middlewares in order, like the gateway stack.
async function run(req: HttpRequest, chain: Array<(...a: any[]) => any>) {
  const { res, out } = mockRes();
  let reached = false;
  for (const mw of chain) {
    let advanced = false;
    await mw(req, res, () => {
      advanced = true;
    });
    if (!advanced) return { ...out, reached };
  }
  reached = true;
  return { ...out, reached };
}

let store: InMemoryApiKeyStore;

beforeEach(() => {
  store = new InMemoryApiKeyStore();
  configureApiKeyStore(store);
});

const withKey = (raw: string): HttpRequest => ({
  headers: { authorization: `Bearer ${raw}` },
});

describe('gateway middleware', () => {
  it('generates luc_live_ keys and stores only the hash', async () => {
    const { raw, key } = await createApiKey({
      ownerId: 'o',
      workspaceId: 'w',
      name: 'n',
      permissions: [],
    });
    expect(raw.startsWith('luc_live_')).toBe(true);
    expect(key.hash).toBe(hashApiKey(raw));
    expect(JSON.stringify(key)).not.toContain(raw);
  });

  it('401 KEY_NOT_PROVIDED without a key', async () => {
    const r = await run({ headers: {} }, [apiKeyMiddleware]);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('KEY_NOT_PROVIDED');
    expect(r.body.requestId).toMatch(/^req_/);
  });

  it('401 KEY_NOT_FOUND only when the hash does not exist', async () => {
    const r = await run(withKey('luc_live_nope'), [apiKeyMiddleware]);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('KEY_NOT_FOUND');
  });

  it('accepts x-api-key and resolves owner and workspace', async () => {
    const { raw } = await createApiKey({
      ownerId: 'o1',
      workspaceId: 'w1',
      name: 'n',
      permissions: [],
    });
    const req: HttpRequest = { headers: { 'x-api-key': raw } };
    const r = await run(req, [apiKeyMiddleware]);
    expect(r.reached).toBe(true);
    expect(req.ownerId).toBe('o1');
    expect(req.workspaceId).toBe('w1');
  });

  it('403 KEY_DISABLED and ACCOUNT_SUSPENDED', async () => {
    const a = await createApiKey({
      ownerId: 'o',
      workspaceId: 'w',
      name: 'a',
      permissions: [],
    });
    a.key.status = 'disabled';
    const b = await createApiKey({
      ownerId: 'o',
      workspaceId: 'w',
      name: 'b',
      permissions: [],
    });
    b.key.status = 'suspended';
    expect(
      (await run(withKey(a.raw), [apiKeyMiddleware])).body.error.code,
    ).toBe('KEY_DISABLED');
    expect(
      (await run(withKey(b.raw), [apiKeyMiddleware])).body.error.code,
    ).toBe('ACCOUNT_SUSPENDED');
  });

  it('403 PERMISSION_DENIED names the required permission', async () => {
    const { raw } = await createApiKey({
      ownerId: 'o',
      workspaceId: 'w',
      name: 'n',
      permissions: ['chat.generate'],
    });
    const r = await run(withKey(raw), [
      apiKeyMiddleware,
      requirePermission('music.generate'),
    ]);
    expect(r.status).toBe(403);
    expect(r.body).toMatchObject({
      success: false,
      error: { code: 'PERMISSION_DENIED', required: 'music.generate' },
    });
  });

  it('full stack passes with the right permission', async () => {
    const { raw } = await createApiKey({
      ownerId: 'o',
      workspaceId: 'w',
      name: 'n',
      permissions: ['music.generate'],
    });
    const r = await run(withKey(raw), [
      apiKeyMiddleware,
      rateLimit(5),
      requirePermission('music.generate'),
    ]);
    expect(r.reached).toBe(true);
  });

  it('429 RATE_LIMIT_EXCEEDED once the owner exceeds the limit', async () => {
    const { raw } = await createApiKey({
      ownerId: 'o',
      workspaceId: 'w',
      name: 'n',
      permissions: ['chat.generate'],
    });
    const limiter = rateLimit(2);
    const chain = [
      apiKeyMiddleware,
      limiter,
      requirePermission('chat.generate'),
    ];
    expect((await run(withKey(raw), chain)).reached).toBe(true);
    expect((await run(withKey(raw), chain)).reached).toBe(true);
    const r = await run(withKey(raw), chain);
    expect(r.status).toBe(429);
    expect(r.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('rate limiter 401 OWNER_NOT_FOUND when no owner was resolved', async () => {
    const r = await run({ headers: {} }, [rateLimit(1)]);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe('OWNER_NOT_FOUND');
  });
});
