import {
  authenticateWorkerRequest,
  canonicalJson,
  isPlainObject,
  json,
  signingSecretOrFailClosed,
} from './lib';
import type { WorkerEnv } from './types';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'Only POST is supported.' }, 405);
    }

    const auth = await authenticateWorkerRequest(request, env);
    if (!auth.ok) {
      return auth.response;
    }
    if (
      !isPlainObject(auth.body) ||
      !Object.hasOwn(auth.body, 'payload') ||
      Object.keys(auth.body).length !== 1
    ) {
      return json(
        { error: 'Request body must contain only a payload property.' },
        400,
      );
    }

    const payload = { tenantId: auth.tenantId, payload: auth.body.payload };
    let canonicalPayload: string;
    try {
      canonicalPayload = canonicalJson(payload);
    } catch {
      return json({ error: 'Payload must contain valid JSON values.' }, 400);
    }

    let secret: string;
    try {
      secret = signingSecretOrFailClosed(env);
    } catch {
      return json({ error: 'Signing is not configured.' }, 503);
    }

    try {
      const signingKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        signingKey,
        new TextEncoder().encode(canonicalPayload),
      );
      const signatureHex = Array.from(new Uint8Array(signature))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      return json({
        payload,
        signature: { algorithm: 'hmac-sha256', value: signatureHex },
      });
    } catch {
      return json({ error: 'Signing failed.' }, 503);
    }
  },
};
