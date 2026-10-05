import { describe, expect, it } from 'vitest';
import coreSignatureWorker from '../src/core-signature-worker';

const env = {
  BOTBASE_SHARED_TOKEN: 'shared-token',
  BOTBASE_SIGNING_SECRET: 'signing-secret',
};

function signedRequest(body: unknown, token = 'shared-token'): Request {
  return new Request('https://workers.example/core-signature', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-tenant-id': 'tenant-a',
    },
    body: JSON.stringify(body),
  });
}

describe('core signature worker', () => {
  it('returns a verified tenant-bound HMAC signature', async () => {
    const response = await coreSignatureWorker.fetch(
      signedRequest({ payload: { version: 1, name: 'manifest' } }),
      env,
    );
    const result = (await response.json()) as {
      payload: unknown;
      signature: { algorithm: string; value: string };
    };

    expect(response.status).toBe(200);
    expect(result.payload).toEqual({
      tenantId: 'tenant-a',
      payload: { version: 1, name: 'manifest' },
    });
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.BOTBASE_SIGNING_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const signature = Uint8Array.from(
      result.signature.value.match(/.{2}/g) ?? [],
      (byte) => Number.parseInt(byte, 16),
    );
    expect(
      await crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        new TextEncoder().encode(
          '{"payload":{"name":"manifest","version":1},"tenantId":"tenant-a"}',
        ),
      ),
    ).toBe(true);
  });

  it('requires the shared token and an explicit payload property', async () => {
    const unauthorized = await coreSignatureWorker.fetch(
      signedRequest({ payload: {} }, 'invalid-token'),
      env,
    );
    const invalidBody = await coreSignatureWorker.fetch(
      signedRequest({ tenantId: 'attacker' }),
      env,
    );

    expect(unauthorized.status).toBe(401);
    expect(invalidBody.status).toBe(400);
  });
});
