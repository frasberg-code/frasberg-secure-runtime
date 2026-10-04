import type { WorkerEnv } from './types';

export async function authenticateWorkerRequest(
  request: Request,
  env: WorkerEnv,
): Promise<
  | { ok: true; tenantId: string; body?: unknown }
  | { ok: false; response: Response }
> {
  const sharedToken = env.BOTBASE_SHARED_TOKEN;
  const providedToken = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  const tenantId = request.headers.get('x-tenant-id')?.trim();

  if (!sharedToken || !providedToken || providedToken !== sharedToken) {
    return {
      ok: false,
      response: json({ error: 'Unauthorized.' }, 401),
    };
  }

  if (!tenantId) {
    return {
      ok: false,
      response: json({ error: 'x-tenant-id is required.' }, 400),
    };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 16_384) {
    return {
      ok: false,
      response: json({ error: 'Payload exceeds bounded worker limit.' }, 413),
    };
  }

  try {
    return {
      ok: true,
      tenantId,
      body: rawBody ? JSON.parse(rawBody) : undefined,
    };
  } catch {
    return {
      ok: false,
      response: json({ error: 'Request body must be valid JSON.' }, 400),
    };
  }
}

export function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function signingSecretOrFailClosed(env: WorkerEnv): string {
  if (!env.BOTBASE_SIGNING_SECRET) {
    throw new Error(
      'BOTBASE_SIGNING_SECRET is required and must be supplied with wrangler secret, not wrangler vars.',
    );
  }
  return env.BOTBASE_SIGNING_SECRET;
}

export function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new Error('Signed value cannot be serialized as JSON.');
    }
    return serialized;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Signed JSON numbers must be finite.');
    }
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new Error('Signed value cannot be serialized as JSON.');
    }
    return serialized;
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  throw new Error('Signed payload must contain only JSON values.');
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
