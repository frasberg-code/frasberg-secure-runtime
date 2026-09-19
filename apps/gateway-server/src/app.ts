import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import {
  validateWorldDefinition,
  type WorldDefinition,
} from '@frasberg/full-game-stack-schema';
import {
  CreateGovernancePolicyInput,
  GovernanceEngine,
} from '@frasberg/shared';
import {
  type WorldGraphListOptions,
  type WorldGraphRequestContext,
  type WorldGraphService,
} from '@frasberg/worldgraph-engine';

export type EngineDomain =
  'music' | 'video' | 'image' | 'voice' | 'stt' | 'tts';
export type EngineJobState = 'queued' | 'running' | 'completed' | 'failed';
export type TrustedRole = 'admin' | 'user';

export interface EngineJobResult {
  jobId: string;
  domain: EngineDomain;
  state: EngineJobState;
  artifactUrl?: string;
}

export interface EngineAdapter {
  submitJob(
    domain: EngineDomain,
    payload: GenerateRequestBody,
  ): Promise<EngineJobResult>;
}

export interface AuditRecord {
  id: string;
  actorId: string;
  action: string;
  target: string;
  createdAt: string;
  detail: Record<string, unknown>;
}

export interface AuditStore {
  record(entry: Omit<AuditRecord, 'id' | 'createdAt'>): Promise<AuditRecord>;
  list(): Promise<AuditRecord[]>;
}

export interface UserRoleStore {
  getRole(userId: string): Promise<TrustedRole | undefined>;
}

export interface JwtVerificationConfig {
  secret: string;
  issuer: string;
  audience: string;
}

export interface GatewayServerOptions {
  jwt: JwtVerificationConfig;
  roleStore: UserRoleStore;
  engineAdapter: EngineAdapter;
  governanceEngine?: GovernanceEngine;
  worldGraphService?: WorldGraphService;
  auditStore?: AuditStore;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: { sub: string; role: TrustedRole };
  }
}

interface GenerateRequestBody {
  prompt: string;
  eid?: string;
}

interface JwtClaims {
  sub: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRoleStore implements UserRoleStore {
  constructor(private readonly rolesByUserId: Record<string, TrustedRole>) {}

  async getRole(userId: string): Promise<TrustedRole | undefined> {
    return this.rolesByUserId[userId];
  }
}

export class InMemoryAuditStore implements AuditStore {
  private readonly entries: AuditRecord[] = [];

  async record(
    entry: Omit<AuditRecord, 'id' | 'createdAt'>,
  ): Promise<AuditRecord> {
    const record: AuditRecord = {
      ...entry,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      detail: { ...entry.detail },
    };
    this.entries.push(record);
    return { ...record, detail: { ...record.detail } };
  }

  async list(): Promise<AuditRecord[]> {
    return this.entries.map((entry) => ({
      ...entry,
      detail: { ...entry.detail },
    }));
  }
}

/**
 * Local-dev fake adapter only. Real music/video/image/voice/STT/TTS backends
 * must be deployed separately and configured via backend URLs.
 */
export class InMemoryFakeEngineAdapter implements EngineAdapter {
  async submitJob(
    domain: EngineDomain,
    payload: GenerateRequestBody,
  ): Promise<EngineJobResult> {
    const prompt = readNonEmptyString(payload.prompt, 'prompt');
    return {
      jobId: randomUUID(),
      domain,
      state: 'queued',
      artifactUrl: `fake://${domain}/${encodeURIComponent(prompt)}`,
    };
  }
}

export function buildGatewayServerApp(
  options: GatewayServerOptions,
): FastifyInstance {
  const governanceEngine = options.governanceEngine ?? new GovernanceEngine();
  const auditStore = options.auditStore ?? new InMemoryAuditStore();
  const rateLimitState = new Map<string, RateLimitEntry>();
  const rateLimitMax = options.rateLimitMax ?? 60;
  const rateLimitWindowMs = options.rateLimitWindowMs ?? 60_000;
  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization'],
    },
  });

  app.addHook('preHandler', async (request, reply) => {
    if ((request.raw.url ?? '').startsWith('/v1/health')) {
      return;
    }

    const principal = await authenticateBearerToken(request, options);
    if (!principal) {
      return reply.code(401).send({ error: 'Unauthorized.' });
    }
    request.principal = principal;
  });

  app.get('/v1/health', async () => ({
    status: 'ok',
    note: 'JWT auth verifies signature, exp, issuer, and audience. Admin access is server-side role lookup based on token sub.',
  }));

  app.post('/v1/generate/:domain', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    try {
      const body = readGenerateRequestBody(request.body);
      const domain = readDomain((request.params as { domain?: string }).domain);
      const result = await options.engineAdapter.submitJob(domain, body);
      return reply.code(202).send(result);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/worldgraph', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const worldGraphService = requireWorldGraphService(reply, options);
    if (!worldGraphService) {
      return;
    }

    try {
      const definition = validateWorldDefinition(request.body);
      const context = readWorldGraphRequestContext(request);
      const record = await worldGraphService.createDefinition(context, definition);
      await auditStore.record({
        actorId: context.ownerId,
        action: 'worldgraph:create',
        target: record.id,
        detail: readWorldGraphAuditDetail(definition),
      });
      return reply.code(201).send(record);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/worldgraph/:id', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const worldGraphService = requireWorldGraphService(reply, options);
    if (!worldGraphService) {
      return;
    }

    try {
      const params = request.params as { id?: string };
      const record = await worldGraphService.getDefinition(
        readWorldGraphRequestContext(request),
        readNonEmptyString(params.id, 'id'),
      );
      if (!record) {
        return reply.code(404).send({ error: 'WorldGraph definition not found.' });
      }
      return reply.code(200).send(record);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.patch('/v1/worldgraph/:id', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const worldGraphService = requireWorldGraphService(reply, options);
    if (!worldGraphService) {
      return;
    }

    try {
      const params = request.params as { id?: string };
      const definition = validateWorldDefinition(request.body);
      const context = readWorldGraphRequestContext(request);
      const record = await worldGraphService.updateDefinition(
        context,
        readNonEmptyString(params.id, 'id'),
        definition,
      );
      if (!record) {
        return reply.code(404).send({ error: 'WorldGraph definition not found.' });
      }
      await auditStore.record({
        actorId: context.ownerId,
        action: 'worldgraph:update',
        target: record.id,
        detail: readWorldGraphAuditDetail(definition),
      });
      return reply.code(200).send(record);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.delete('/v1/worldgraph/:id', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const worldGraphService = requireWorldGraphService(reply, options);
    if (!worldGraphService) {
      return;
    }

    try {
      const params = request.params as { id?: string };
      const context = readWorldGraphRequestContext(request);
      const definitionId = readNonEmptyString(params.id, 'id');
      const existing = await worldGraphService.getDefinition(context, definitionId);
      if (!existing) {
        return reply.code(404).send({ error: 'WorldGraph definition not found.' });
      }

      const deleted = await worldGraphService.deleteDefinition(context, definitionId);
      if (!deleted) {
        return reply.code(404).send({ error: 'WorldGraph definition not found.' });
      }

      await auditStore.record({
        actorId: context.ownerId,
        action: 'worldgraph:delete',
        target: definitionId,
        detail: {
          kind: existing.kind,
          name: existing.name,
          schemaVersion: existing.schemaVersion,
        },
      });
      return reply.code(204).send();
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/worldgraph', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const worldGraphService = requireWorldGraphService(reply, options);
    if (!worldGraphService) {
      return;
    }

    try {
      const query = readWorldGraphListQuery(request.query);
      const page = await worldGraphService.listDefinitions(
        readWorldGraphRequestContext(request),
        query,
      );
      return reply.code(200).send(page);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/admin/control-cycle', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const principal = await requireAdmin(request, reply);
    if (!principal) {
      return;
    }

    await auditStore.record({
      actorId: principal.sub,
      action: 'control-cycle:run',
      target: 'runtime',
      detail: { trigger: 'manual' },
    });

    return reply.code(202).send({ accepted: true });
  });

  app.patch('/v1/admin/governance/policies/:id', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const principal = await requireAdmin(request, reply);
    if (!principal) {
      return;
    }

    try {
      const params = request.params as { id?: string };
      const policyId = readNonEmptyString(params.id, 'id');
      const body = readPolicyUpdateBody(request.body);
      const updated = governanceEngine.updatePolicy(policyId, body);
      await auditStore.record({
        actorId: principal.sub,
        action: 'governance:update-policy',
        target: policyId,
        detail: {
          meaningThreshold: updated.meaningThreshold,
          riskThreshold: updated.riskThreshold,
        },
      });
      return reply.code(200).send(updated);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/admin/audit', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const principal = await requireAdmin(request, reply);
    if (!principal) {
      return;
    }

    return reply.code(200).send({ records: await auditStore.list() });
  });

  app.post('/v1/admin/governance/policies', async (request, reply) => {
    if (
      !enforceRateLimit(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      )
    ) {
      return;
    }

    const principal = await requireAdmin(request, reply);
    if (!principal) {
      return;
    }

    try {
      const body = readPolicyCreateBody(request.body);
      const policy = governanceEngine.createPolicy(body);
      await auditStore.record({
        actorId: principal.sub,
        action: 'governance:create-policy',
        target: policy.id,
        detail: {
          name: policy.name,
          meaningThreshold: policy.meaningThreshold,
          riskThreshold: policy.riskThreshold,
        },
      });
      return reply.code(201).send(policy);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  return app;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<{ sub: string; role: TrustedRole } | undefined> {
  if (request.principal?.role !== 'admin') {
    reply.code(403).send({ error: 'Admin access required.' });
    return undefined;
  }
  return request.principal;
}

async function authenticateBearerToken(
  request: FastifyRequest,
  options: GatewayServerOptions,
): Promise<{ sub: string; role: TrustedRole } | undefined> {
  const authorization = request.headers.authorization;
  if (typeof authorization !== 'string') {
    return undefined;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return undefined;
  }

  try {
    const claims = verifyJwtHs256(token, options.jwt);
    const role = await options.roleStore.getRole(claims.sub);
    if (!role) {
      return undefined;
    }
    return { sub: claims.sub, role };
  } catch {
    return undefined;
  }
}

function verifyJwtHs256(
  token: string,
  config: JwtVerificationConfig,
): JwtClaims {
  const segments = token.split('.');
  if (segments.length !== 3) {
    throw new Error('Malformed JWT.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const header = parseJson(base64UrlDecode(encodedHeader), 'JWT header');
  if (header.alg !== 'HS256') {
    throw new Error('Unsupported JWT algorithm.');
  }

  const expectedSignature = createHmac('sha256', config.secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actualSignature = base64UrlDecode(encodedSignature);
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new Error('Invalid JWT signature.');
  }

  const claims = parseJson(base64UrlDecode(encodedPayload), 'JWT payload');
  const normalized = readJwtClaims(claims);
  const now = Math.floor(Date.now() / 1000);
  if (normalized.exp <= now) {
    throw new Error('Token expired.');
  }
  if (normalized.iss !== config.issuer) {
    throw new Error('Invalid token issuer.');
  }
  if (
    (Array.isArray(normalized.aud) &&
      !normalized.aud.includes(config.audience)) ||
    (!Array.isArray(normalized.aud) && normalized.aud !== config.audience)
  ) {
    throw new Error('Invalid token audience.');
  }

  return normalized;
}

function readGenerateRequestBody(value: unknown): GenerateRequestBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }
  const payload = value as Record<string, unknown>;
  return {
    prompt: readNonEmptyString(payload.prompt, 'prompt'),
    eid:
      payload.eid === undefined
        ? undefined
        : readNonEmptyString(payload.eid, 'eid'),
  };
}

function requireWorldGraphService(
  reply: FastifyReply,
  options: GatewayServerOptions,
): WorldGraphService | undefined {
  if (!options.worldGraphService) {
    reply.code(503).send({ error: 'WorldGraph service is not configured.' });
    return undefined;
  }
  return options.worldGraphService;
}

function readWorldGraphRequestContext(
  request: FastifyRequest,
): WorldGraphRequestContext {
  const authorization = request.headers.authorization;
  const principal = request.principal;
  if (!principal || typeof authorization !== 'string') {
    throw new Error('Authenticated WorldGraph access requires a bearer token.');
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new Error('Authenticated WorldGraph access requires a bearer token.');
  }

  return {
    accessToken: token,
    ownerId: principal.sub,
  };
}

function readWorldGraphListQuery(value: unknown): WorldGraphListOptions {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Query must be an object.');
  }

  const query = value as Record<string, unknown>;
  return {
    page:
      query.page === undefined
        ? 1
        : readPositiveIntegerQuery(query.page, 'page', 1, 10_000),
    pageSize:
      query.pageSize === undefined
        ? 20
        : readPositiveIntegerQuery(query.pageSize, 'pageSize', 1, 100),
  };
}

function readWorldGraphAuditDetail(
  definition: WorldDefinition,
): Record<string, unknown> {
  return {
    kind: definition.kind,
    name: definition.name,
    schemaVersion: definition.metadata.schemaVersion,
  };
}

function readPolicyUpdateBody(value: unknown): {
  meaningThreshold?: number;
  riskThreshold?: number;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }

  const payload = value as Record<string, unknown>;
  if (
    payload.meaningThreshold === undefined &&
    payload.riskThreshold === undefined
  ) {
    throw new Error('At least one threshold must be provided.');
  }

  return {
    meaningThreshold: readOptionalUnitInterval(
      payload.meaningThreshold,
      'meaningThreshold',
    ),
    riskThreshold: readOptionalUnitInterval(
      payload.riskThreshold,
      'riskThreshold',
    ),
  };
}

function readPolicyCreateBody(value: unknown): CreateGovernancePolicyInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }
  const payload = value as Record<string, unknown>;
  return {
    id:
      payload.id === undefined
        ? undefined
        : readNonEmptyString(payload.id, 'id'),
    name: readNonEmptyString(payload.name, 'name'),
    meaningThreshold: readUnitInterval(
      payload.meaningThreshold,
      'meaningThreshold',
    ),
    riskThreshold: readUnitInterval(payload.riskThreshold, 'riskThreshold'),
  };
}

function readDomain(value: unknown): EngineDomain {
  if (
    value !== 'music' &&
    value !== 'video' &&
    value !== 'image' &&
    value !== 'voice' &&
    value !== 'stt' &&
    value !== 'tts'
  ) {
    throw new Error('Unsupported generation domain.');
  }

  return value;
}

function readJwtClaims(value: unknown): JwtClaims {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('JWT payload must be an object.');
  }
  const payload = value as Record<string, unknown>;
  return {
    sub: readNonEmptyString(payload.sub, 'sub'),
    iss: readNonEmptyString(payload.iss, 'iss'),
    aud: readAudience(payload.aud),
    exp: readInteger(payload.exp, 'exp'),
    iat:
      payload.iat === undefined ? undefined : readInteger(payload.iat, 'iat'),
  };
}

function readAudience(value: unknown): string | string[] {
  if (typeof value === 'string') {
    return value;
  }
  if (!Array.isArray(value)) {
    throw new Error('aud must be a string or string array.');
  }
  return value.map((entry, index) =>
    readNonEmptyString(entry, `aud[${index}]`),
  );
}

function parseJson(value: Buffer, label: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value.toString('utf8')) as Record<
      string,
      unknown
    >;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed;
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  return Buffer.from(padded, 'base64');
}

function readInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer.`);
  }

  return value;
}

function readPositiveIntegerQuery(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  const normalized =
    typeof value === 'string' ? Number.parseInt(value, 10) : readInteger(value, label);
  if (
    !Number.isInteger(normalized) ||
    !Number.isFinite(normalized) ||
    normalized < minimum ||
    normalized > maximum
  ) {
    throw new Error(`${label} must be an integer between ${minimum} and ${maximum}.`);
  }
  return normalized;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function readUnitInterval(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }
  if (value < 0 || value > 1) {
    throw new Error(`${label} must be between 0 and 1.`);
  }
  return value;
}

function readOptionalUnitInterval(
  value: unknown,
  label: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return readUnitInterval(value, label);
}

function consumeRateLimit(
  state: Map<string, RateLimitEntry>,
  key: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const current = state.get(key);
  if (!current || current.resetAt <= now) {
    state.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= max) {
    return false;
  }

  current.count += 1;
  return true;
}

function enforceRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  state: Map<string, RateLimitEntry>,
  max: number,
  windowMs: number,
): boolean {
  const principal = request.principal;
  if (!principal) {
    return false;
  }

  if (
    !consumeRateLimit(
      state,
      `${principal.sub}:${request.routeOptions.url}`,
      max,
      windowMs,
    )
  ) {
    reply.code(429).send({ error: 'Too many requests.' });
    return false;
  }

  return true;
}
