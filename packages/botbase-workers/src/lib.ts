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
  if (rawBody.length > 16_384) {
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
