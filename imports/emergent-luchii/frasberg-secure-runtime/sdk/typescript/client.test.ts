import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Frasberg, FrasbergApiError, parseEnvelope } from './index';

describe('Frasberg TypeScript SDK', () => {
  it('signs POST bodies and does not send client-asserted owner IDs', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ job_id: 'job-1' }));
    const client = new Frasberg({
      key: 'secret',
      tenantId: 'tenant-a',
      fetchImpl: fetchImpl as typeof fetch,
    });
    const body = { prompt: 'hello' };

    await expect(client.request('/v1/jobs', body)).resolves.toEqual({
      job_id: 'job-1',
    });

    const [url, options] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const headers = new Headers(options.headers);
    const expectedSignature = createHmac('sha256', 'secret')
      .update(JSON.stringify(body))
      .digest('hex');
    expect(url).toBe('https://frasberg.com/api/v1/jobs');
    expect(headers.get('authorization')).toBe('Bearer secret');
    expect(headers.get('x-api-signature')).toBe(expectedSignature);
    expect(headers.get('x-tenant-id')).toBe('tenant-a');
    expect(headers.has('x-owner-id')).toBe(false);
  });

  it('fails over on GET server failures', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ status: 'ok' }));
    const client = new Frasberg({
      key: 'secret',
      baseUrls: ['https://west.example/api', 'https://east.example/api'],
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(client.request('/health')).resolves.toEqual({ status: 'ok' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry POST requests after an upstream failure', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: 'busy' }, { status: 503 }),
    );
    const client = new Frasberg({
      key: 'secret',
      baseUrls: ['https://west.example/api', 'https://east.example/api'],
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(
      client.request('/v1/jobs', { prompt: 'hello' }),
    ).rejects.toBeInstanceOf(FrasbergApiError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed envelopes', () => {
    expect(() => parseEnvelope({ version: 'v1' })).toThrow(
      'Invalid Frasberg API envelope.',
    );
  });

  it('rejects paths that escape the configured API base', async () => {
    const client = new Frasberg({
      key: 'secret',
      baseUrls: ['https://runtime.example/api'],
      fetchImpl: vi.fn() as typeof fetch,
    });

    await expect(client.request('/%2e%2e/private')).rejects.toThrow(
      'Frasberg API path cannot escape the configured base URL.',
    );
  });
});
