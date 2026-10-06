import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  KEY_PREFIX,
  PERMISSION_CATALOG,
  createApiKey,
  hashApiKey,
  type ApiKey,
  type ApiKeyStore,
} from '@frasberg/luchii-api-keys';
import { buildErrorResponse } from '@frasberg/core';
import type { AuthContext, Permission } from '@frasberg/shared';
import type { RuntimeStateStore } from './runtime-state-store';

// Luchii scopes a user can grant -> gateway permissions they unlock.
const SCOPE_TO_PERMISSIONS: Record<string, Permission[]> = {
  'chat.generate': ['chat'],
  'image.generate': ['media'],
  'music.generate': ['audio'],
  'gt6.run': ['jobs:read', 'jobs:write'],
  'agents.execute': ['jobs:read', 'jobs:write'],
  'memory.read': ['jobs:read'],
  'memory.write': ['jobs:write'],
  'checkout.use': [],
};

const PERMISSION_TO_SCOPE: Partial<Record<Permission, string>> = {
  chat: 'chat.generate',
  media: 'image.generate',
  audio: 'music.generate',
  'jobs:read': 'gt6.run',
  'jobs:write': 'gt6.run',
};

export const LUCHII_KEY_ID_PREFIX = 'luchii-key:';

export function permissionsForScopes(scopes: string[]): Permission[] {
  const result = new Set<Permission>();
  for (const scope of scopes) {
    for (const permission of SCOPE_TO_PERMISSIONS[scope] ?? []) {
      result.add(permission);
    }
  }
  return [...result];
}

export function requiredScopeFor(permission: Permission): string | undefined {
  return PERMISSION_TO_SCOPE[permission];
}

const VALID_SCOPES = new Set(Object.values(PERMISSION_CATALOG).flat());

// Persists keys in the gateway's runtime state table (in-memory without one).
export class RuntimeStoreApiKeyStore implements ApiKeyStore {
  constructor(private readonly store: RuntimeStateStore) {}

  async findByHash(hash: string) {
    const record = await this.store.get(`APIKEY#${hash}`, 'KEY');
    return record?.value as ApiKey | undefined;
  }

  async save(key: ApiKey) {
    await this.store.put({
      pk: `APIKEY#${key.hash}`,
      sk: 'KEY',
      kind: 'api-key',
      value: key,
    });
    await this.store.put({
      pk: `APIKEYS#${key.workspaceId}`,
      sk: `KEY#${key.id}`,
      kind: 'api-key-index',
      value: key,
    });
  }

  async list(workspaceId: string) {
    const records = await this.store.query(`APIKEYS#${workspaceId}`, {
      skPrefix: 'KEY#',
    });
    return records.map((record) => record.value as ApiKey);
  }
}

function presentedSecret(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const apiKey = first(headers['x-api-key']);
  const authorization = first(headers.authorization);
  const bearer = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : undefined;
  return apiKey ?? bearer;
}

export function isLuchiiKey(
  headers: Record<string, string | string[] | undefined>,
): boolean {
  return presentedSecret(headers)?.startsWith(KEY_PREFIX) ?? false;
}

// Returns true when the request was handled (rejected or authenticated).
export async function authenticateLuchiiKey(
  request: FastifyRequest,
  reply: FastifyReply,
  store: ApiKeyStore,
): Promise<boolean> {
  const secret = presentedSecret(request.headers);
  if (!secret?.startsWith(KEY_PREFIX)) {
    return false;
  }

  let key: ApiKey | undefined;
  try {
    key = await store.findByHash(hashApiKey(secret));
  } catch (error) {
    request.log.error({ err: error }, 'API key store unavailable');
    await reply
      .code(503)
      .send(
        buildErrorResponse(
          request.id,
          'SERVICE_UNAVAILABLE',
          'API key service unavailable.',
        ),
      );
    return true;
  }

  if (!key) {
    await reply
      .code(401)
      .send(
        buildErrorResponse(request.id, 'KEY_NOT_FOUND', 'API key not found.'),
      );
    return true;
  }
  if (key.status !== 'active') {
    const suspended = key.status === 'suspended';
    await reply
      .code(403)
      .send(
        buildErrorResponse(
          request.id,
          suspended ? 'ACCOUNT_SUSPENDED' : 'KEY_DISABLED',
          suspended ? 'Account suspended.' : 'API key disabled.',
        ),
      );
    return true;
  }

  const context: AuthContext = {
    authenticated: true,
    keyId: `${LUCHII_KEY_ID_PREFIX}${key.id}`,
    permissions: permissionsForScopes(key.permissions),
    tenantId: key.workspaceId,
  };
  request.authContext = context;
  return true;
}

function publicKey(key: ApiKey) {
  const { hash: _hash, ...rest } = key;
  return rest;
}

function signedInUser(request: FastifyRequest): string | undefined {
  const context = request.authContext;
  return context?.keyId?.startsWith('supabase-user:')
    ? context.userId
    : undefined;
}

export function registerApiKeyRoutes(app: FastifyInstance, store: ApiKeyStore) {
  const deny = (request: FastifyRequest, reply: FastifyReply) =>
    reply
      .code(403)
      .send(
        buildErrorResponse(
          request.id,
          'PERMISSION_DENIED',
          'Sign in to manage API keys.',
        ),
      );

  app.get('/v1/api-keys/catalog', async (request, reply) => {
    if (!signedInUser(request)) return deny(request, reply);
    return { catalog: PERMISSION_CATALOG };
  });

  app.get('/v1/api-keys', async (request, reply) => {
    const userId = signedInUser(request);
    if (!userId) return deny(request, reply);
    return { keys: (await store.list(userId)).map(publicKey) };
  });

  app.post('/v1/api-keys', async (request, reply) => {
    const userId = signedInUser(request);
    if (!userId) return deny(request, reply);

    const body = (request.body ?? {}) as { name?: unknown; scopes?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const scopes = Array.isArray(body.scopes)
      ? body.scopes.filter((s): s is string => typeof s === 'string')
      : [];
    if (!name || name.length > 80 || scopes.length === 0) {
      return reply
        .code(400)
        .send(
          buildErrorResponse(
            request.id,
            'INVALID_REQUEST',
            'A name and at least one scope are required.',
          ),
        );
    }
    const unknown = scopes.filter((scope) => !VALID_SCOPES.has(scope));
    if (unknown.length > 0) {
      return reply.code(400).send(
        buildErrorResponse(request.id, 'INVALID_SCOPE', 'Unknown scope.', {
          unknown,
        }),
      );
    }

    const { raw, key } = await createApiKey(
      { ownerId: userId, workspaceId: userId, name, permissions: scopes },
      store,
    );
    // The raw key is returned exactly once and never stored.
    return reply.code(201).send({ key: raw, record: publicKey(key) });
  });

  app.delete('/v1/api-keys/:id', async (request, reply) => {
    const userId = signedInUser(request);
    if (!userId) return deny(request, reply);

    const { id } = request.params as { id: string };
    const key = (await store.list(userId)).find(
      (candidate) => candidate.id === id,
    );
    if (!key) {
      return reply
        .code(404)
        .send(
          buildErrorResponse(request.id, 'KEY_NOT_FOUND', 'API key not found.'),
        );
    }
    await store.save({ ...key, status: 'disabled' });
    return { record: publicKey({ ...key, status: 'disabled' }) };
  });
}
