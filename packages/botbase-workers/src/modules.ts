import {
  authenticateWorkerRequest,
  canonicalJson,
  json,
  isPlainObject,
  signingSecretOrFailClosed,
} from './lib';
import type { WorkerEnv } from './types';

const unimplementedModules = new Set([
  '/mesh-routing',
  '/search',
  '/billing',
  '/compliance',
  '/telemetry',
  '/policy-governance',
  '/identity',
  '/cdn',
  '/dns-plan-drift',
  '/threat-analysis',
  '/secrets-vault',
  '/ledgers',
  '/graph',
  '/replication',
]);

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'Only POST is supported.' }, 405);
    }

    const auth = await authenticateWorkerRequest(request, env);
    if (!auth.ok) {
      return auth.response;
    }

    const url = new URL(request.url);
    if (url.pathname === '/manifest-compilation') {
      return compileManifest(auth.tenantId, auth.body, env);
    }
    if (!unimplementedModules.has(url.pathname)) {
      return json({ error: 'Unknown BotBase scaffold module.' }, 404);
    }

    return json(
      {
        error: 'This BotBase module is not implemented.',
        module: url.pathname.slice(1),
      },
      501,
    );
  },
};

async function compileManifest(
  tenantId: string,
  body: unknown,
  env: WorkerEnv,
): Promise<Response> {
  if (
    !isPlainObject(body) ||
    !isPlainObject(body.manifest) ||
    Object.keys(body).some((key) => key !== 'manifest')
  ) {
    return json(
      { error: 'Request body must contain only a manifest object.' },
      400,
    );
  }

  if (
    body.manifest.tenantId !== undefined &&
    body.manifest.tenantId !== tenantId
  ) {
    return json(
      { error: 'Manifest tenant does not match the authenticated tenant.' },
      403,
    );
  }

  let manifest: JsonObject;
  try {
    manifest = normalizeJsonObject(body.manifest, 0, { count: 0 });
  } catch {
    return json({ error: 'Manifest exceeds supported JSON limits.' }, 400);
  }

  const payload: JsonObject = { tenantId, manifest };
  let signingSecret: string;
  try {
    signingSecret = signingSecretOrFailClosed(env);
  } catch {
    return json({ error: 'Manifest signing is not configured.' }, 503);
  }

  const canonicalPayload = canonicalJson(payload);
  let signature: ArrayBuffer;
  try {
    const signingKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(signingSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    signature = await crypto.subtle.sign(
      'HMAC',
      signingKey,
      new TextEncoder().encode(canonicalPayload),
    );
  } catch {
    return json({ error: 'Manifest signing failed.' }, 503);
  }
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return json({
    payload,
    signature: {
      algorithm: 'hmac-sha256',
      value: signatureHex,
    },
  });
}

type JsonObject = { [key: string]: JsonValue };
type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;

function normalizeJsonObject(
  value: Record<string, unknown>,
  depth: number,
  state: { count: number },
): JsonObject {
  if (depth > 32) {
    throw new Error('Maximum manifest depth exceeded.');
  }

  const result: JsonObject = Object.create(null) as JsonObject;
  for (const key of Object.keys(value).sort()) {
    state.count += 1;
    if (state.count > 2_000) {
      throw new Error('Maximum manifest property count exceeded.');
    }
    result[key] = normalizeJsonValue(value[key], depth + 1, state);
  }
  return result;
}

function normalizeJsonValue(
  value: unknown,
  depth: number,
  state: { count: number },
): JsonValue {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    if (depth > 32) {
      throw new Error('Maximum manifest depth exceeded.');
    }
    return value.map((item) => {
      state.count += 1;
      if (state.count > 2_000) {
        throw new Error('Maximum manifest item count exceeded.');
      }
      return normalizeJsonValue(item, depth + 1, state);
    });
  }
  if (isPlainObject(value)) {
    return normalizeJsonObject(value, depth, state);
  }
  throw new Error('Manifest must be JSON-compatible.');
}
