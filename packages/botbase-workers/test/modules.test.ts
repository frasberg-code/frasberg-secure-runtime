import { describe, expect, it } from 'vitest';
import modulesWorker from '../src/modules';
import type { WorkerEnv } from '../src/types';

const env: WorkerEnv = {
  BOTBASE_SHARED_TOKEN: 'shared-token',
  BOTBASE_SIGNING_SECRET: 'signing-secret',
};

function request(path: string, body: unknown): Request {
  return new Request(`https://workers.example${path}`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer shared-token',
      'content-type': 'application/json',
      'x-tenant-id': 'tenant-a',
    },
    body: JSON.stringify(body),
  });
}

describe('BotBase modules worker', () => {
  it('compiles a tenant-bound manifest and returns a verifiable HMAC', async () => {
    const response = await modulesWorker.fetch(
      request('/manifest-compilation', {
        manifest: { version: 1, name: 'runtime', tenantId: 'tenant-a' },
      }),
      env,
    );
    const result = (await response.json()) as {
      payload: { tenantId: string; manifest: Record<string, unknown> };
      signature: { algorithm: string; value: string };
    };

    expect(response.status).toBe(200);
    expect(result.payload).toEqual({
      tenantId: 'tenant-a',
      manifest: { name: 'runtime', tenantId: 'tenant-a', version: 1 },
    });
    expect(result.signature.algorithm).toBe('hmac-sha256');

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.BOTBASE_SIGNING_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const canonicalPayload =
      '{"manifest":{"name":"runtime","tenantId":"tenant-a","version":1},"tenantId":"tenant-a"}';
    const signature = Uint8Array.from(
      result.signature.value.match(/.{2}/g) ?? [],
      (byte) => Number.parseInt(byte, 16),
    );
    expect(
      await crypto.subtle.verify(
        'HMAC',
        key,
        signature,
        new TextEncoder().encode(canonicalPayload),
      ),
    ).toBe(true);
  });

  it('rejects a manifest that tries to claim another tenant', async () => {
    const response = await modulesWorker.fetch(
      request('/manifest-compilation', {
        manifest: { tenantId: 'tenant-b' },
      }),
      env,
    );

    expect(response.status).toBe(403);
  });

  it('requires a signing secret for manifest compilation', async () => {
    const response = await modulesWorker.fetch(
      request('/manifest-compilation', { manifest: { version: 1 } }),
      { BOTBASE_SHARED_TOKEN: 'shared-token' },
    );

    expect(response.status).toBe(503);
  });

  it('returns not implemented instead of echoing requests for unsupported modules', async () => {
    const response = await modulesWorker.fetch(
      request('/billing', { cardNumber: 'must-not-be-echoed' }),
      env,
    );

    expect(response.status).toBe(501);
    expect(await response.text()).not.toContain('must-not-be-echoed');
  });

  it('enforces the request limit using UTF-8 bytes', async () => {
    const response = await modulesWorker.fetch(
      request('/manifest-compilation', {
        manifest: { description: '\u{1f680}'.repeat(5_000) },
      }),
      env,
    );

    expect(response.status).toBe(413);
  });
});
