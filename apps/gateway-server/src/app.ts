import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import {
  AuditLog,
  CreateGovernancePolicyInput,
  ExistentialControlPlane,
  GovernanceEngine,
  PolicyRegistry,
  RegisterWorldGraphWorldInput,
} from '@frasberg/shared';

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

export interface AuditListPage {
  records: AuditRecord[];
  total: number;
}

export interface AuditStore {
  record(entry: Omit<AuditRecord, 'id' | 'createdAt'>): Promise<AuditRecord>;
  list(): Promise<AuditRecord[]>;
  listPage?(options: { limit: number; offset: number }): Promise<AuditListPage>;
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
  controlPlane?: ExistentialControlPlane;
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
  private readonly auditLog: AuditLog;

  constructor(auditLog = new AuditLog()) {
    this.auditLog = auditLog;
  }

  async record(
    entry: Omit<AuditRecord, 'id' | 'createdAt'>,
  ): Promise<AuditRecord> {
    return this.auditLog.record({
      actorId: entry.actorId,
      action: entry.action,
      target: entry.target,
      detail: entry.detail,
    });
  }

  async list(): Promise<AuditRecord[]> {
    return this.auditLog.list();
  }

  async listPage(options: {
    limit: number;
    offset: number;
  }): Promise<AuditListPage> {
    return this.auditLog.listPage(options);
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
  const governanceEngine =
    options.controlPlane?.policyRegistry ??
    options.governanceEngine ??
    new PolicyRegistry();
  const controlPlane =
    options.controlPlane ??
    new ExistentialControlPlane({ policyRegistry: governanceEngine });
  const auditStore =
    options.auditStore ?? new InMemoryAuditStore(controlPlane.auditLog);
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

  app.get('/v1/admin/control/status', async (request, reply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    return reply.code(200).send(controlPlane.getStatus());
  });

  const runControlCycle = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    const principal = request.principal as { sub: string; role: TrustedRole };
    const result = controlPlane.runCycle();
    await auditStore.record({
      actorId: principal.sub,
      action: 'control-cycle:run',
      target: 'runtime',
      detail: {
        cycleId: result.cycleId,
        anomalyCount: result.anomalies.length,
        actionCount: result.actions.length,
      },
    });

    return reply.code(200).send(result);
  };

  app.post('/v1/admin/control-cycle', runControlCycle);
  app.post('/v1/admin/control/run-cycle', runControlCycle);

  const createPolicy = async (request: FastifyRequest, reply: FastifyReply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    try {
      const principal = request.principal as { sub: string; role: TrustedRole };
      const body = readPolicyCreateBody(request.body);
      const policy = governanceEngine.createPolicy(body);
      await auditStore.record({
        actorId: principal.sub,
        action: 'policy:register',
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
  };

  app.post('/v1/admin/governance/policies', createPolicy);
  app.post('/v1/admin/policy/register', createPolicy);

  const updatePolicy = async (request: FastifyRequest, reply: FastifyReply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    try {
      const principal = request.principal as { sub: string; role: TrustedRole };
      const params = request.params as { id?: string };
      const policyId = readNonEmptyString(params.id, 'id');
      const body = readPolicyUpdateBody(request.body);
      const updated = governanceEngine.updatePolicy(policyId, body);
      await auditStore.record({
        actorId: principal.sub,
        action: 'policy:update',
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
  };

  app.patch('/v1/admin/governance/policies/:id', updatePolicy);
  app.post('/v1/admin/policy/update/:id', updatePolicy);

  app.post('/v1/admin/worlds/register', async (request, reply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    try {
      const principal = request.principal as { sub: string; role: TrustedRole };
      const body = readWorldRegistrationBody(request.body);
      const world = controlPlane.registerWorld(body);
      await auditStore.record({
        actorId: principal.sub,
        action: 'world:register',
        target: world.id,
        detail: {
          label: world.label,
          meaningScore: world.meaningScore,
          riskProfile: world.riskProfile,
        },
      });
      return reply.code(201).send(world);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.delete('/v1/admin/worlds/:id', async (request, reply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    try {
      const principal = request.principal as { sub: string; role: TrustedRole };
      const worldId = readNonEmptyString(
        (request.params as { id?: string }).id,
        'id',
      );
      if (!controlPlane.worldGraph.getWorld(worldId)) {
        return reply
          .code(404)
          .send({ error: `World "${worldId}" does not exist.` });
      }

      const world = controlPlane.removeWorld(worldId);
      await auditStore.record({
        actorId: principal.sub,
        action: 'world:delete',
        target: world.id,
        detail: { label: world.label },
      });
      return reply.code(200).send({ deleted: true, world });
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.post('/v1/admin/continuity/simulate', async (request, reply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    try {
      const principal = request.principal as { sub: string; role: TrustedRole };
      const body = readContinuitySimulationBody(request.body);
      const result = controlPlane.simulateContinuity(body);
      await auditStore.record({
        actorId: principal.sub,
        action: 'continuity:simulate',
        target: body.worldId,
        detail: {
          simulationId: result.simulationId,
          projectedMeaningScore: result.projectedMeaningScore,
          projectedRiskProfile: result.projectedRiskProfile,
        },
      });
      return reply.code(200).send(result);
    } catch (error) {
      return reply.code(400).send({ error: (error as Error).message });
    }
  });

  app.get('/v1/admin/diagnostics', async (request, reply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    return reply.code(200).send(controlPlane.getDiagnostics());
  });

  app.get('/v1/admin/audit', async (request, reply) => {
    if (
      !(await enforceAdminRoute(
        request,
        reply,
        rateLimitState,
        rateLimitMax,
        rateLimitWindowMs,
      ))
    ) {
      return;
    }

    try {
      const { limit, offset } = readAuditListQuery(request.query);
      const page = auditStore.listPage
        ? await auditStore.listPage({ limit, offset })
        : await listAuditPageFallback(auditStore, { limit, offset });
      return reply.code(200).send({
        records: page.records,
        total: page.total,
        limit,
        offset,
        nextOffset: offset + limit < page.total ? offset + limit : null,
      });
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

async function enforceAdminRoute(
  request: FastifyRequest,
  reply: FastifyReply,
  state: Map<string, RateLimitEntry>,
  max: number,
  windowMs: number,
): Promise<boolean> {
  if (!enforceRateLimit(request, reply, state, max, windowMs)) {
    return false;
  }

  return Boolean(await requireAdmin(request, reply));
}

async function listAuditPageFallback(
  auditStore: AuditStore,
  options: { limit: number; offset: number },
): Promise<AuditListPage> {
  const records = await auditStore.list();
  return {
    records: records.slice(options.offset, options.offset + options.limit),
    total: records.length,
  };
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

function readWorldRegistrationBody(
  value: unknown,
): RegisterWorldGraphWorldInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }

  const payload = value as Record<string, unknown>;
  return {
    id:
      payload.id === undefined
        ? undefined
        : readNonEmptyString(payload.id, 'id'),
    label: readNonEmptyString(payload.label, 'label'),
    eid: readNonEmptyString(payload.eid, 'eid'),
    existenceState: readNonEmptyString(
      payload.existenceState,
      'existenceState',
    ),
    continuityArc: readNonEmptyString(payload.continuityArc, 'continuityArc'),
    meaningScore: readUnitInterval(payload.meaningScore, 'meaningScore'),
    riskProfile: readUnitInterval(payload.riskProfile, 'riskProfile'),
    tags: readStringArray(payload.tags, 'tags'),
  };
}

function readContinuitySimulationBody(value: unknown): {
  worldId: string;
  prompt?: string;
  steps?: number;
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Request body must be an object.');
  }

  const payload = value as Record<string, unknown>;
  return {
    worldId: readNonEmptyString(payload.worldId, 'worldId'),
    prompt:
      payload.prompt === undefined
        ? undefined
        : readNonEmptyString(payload.prompt, 'prompt'),
    steps:
      payload.steps === undefined
        ? undefined
        : readIntegerInRange(payload.steps, 1, 10, 'steps'),
  };
}

function readAuditListQuery(value: unknown): { limit: number; offset: number } {
  if (value === undefined) {
    return { limit: 50, offset: 0 };
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Query must be an object.');
  }

  const query = value as Record<string, unknown>;
  return {
    limit:
      query.limit === undefined
        ? 50
        : readIntegerLikeInRange(query.limit, 1, 100, 'limit'),
    offset:
      query.offset === undefined
        ? 0
        : readIntegerLikeInRange(query.offset, 0, 10_000, 'offset'),
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

function readIntegerLikeInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  const numericValue =
    typeof value === 'string' && value.trim().length > 0
      ? Number(value)
      : value;
  if (typeof numericValue !== 'number' || !Number.isInteger(numericValue)) {
    throw new Error(`${label} must be an integer.`);
  }

  if (numericValue < minimum || numericValue > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }

  return numericValue;
}

function readIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  const integer = readInteger(value, label);
  if (integer < minimum || integer > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }

  return integer;
}

function readNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function readStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value.map((entry, index) =>
    readNonEmptyString(entry, `${label}[${index}]`),
  );
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
