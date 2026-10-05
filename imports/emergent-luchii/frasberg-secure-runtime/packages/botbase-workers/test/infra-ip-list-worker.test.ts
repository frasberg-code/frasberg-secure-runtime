import { describe, expect, it } from 'vitest';
import infraIpListWorker from '../src/infra-ip-list-worker';
import type { WorkerEnv } from '../src/types';

const validRequest = () =>
  new Request('https://workers.example/infra-ip-list', {
    method: 'GET',
    headers: {
      authorization: 'Bearer shared-token',
      'x-tenant-id': 'tenant-a',
    },
  });

describe('infrastructure IP list worker', () => {
  it('returns configured unique IPv4 addresses and CIDRs', async () => {
    const response = await infraIpListWorker.fetch(validRequest(), {
      BOTBASE_SHARED_TOKEN: 'shared-token',
      BOTBASE_INFRA_IP_CIDRS: '203.0.113.10, 198.51.100.0/24,203.0.113.10',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tenantId: 'tenant-a',
      addresses: ['203.0.113.10', '198.51.100.0/24'],
    });
  });

  it.each([
    undefined,
    '127.0.0.1/33',
    '256.1.1.1/24',
    '10.0.0.1/24,not-an-address',
  ])(
    'fails closed for missing or invalid CIDR configuration (%s)',
    async (cidrs) => {
      const env: WorkerEnv = {
        BOTBASE_SHARED_TOKEN: 'shared-token',
        BOTBASE_INFRA_IP_CIDRS: cidrs,
      };
      const response = await infraIpListWorker.fetch(validRequest(), env);

      expect(response.status).toBe(503);
    },
  );

  it('rejects unsupported methods', async () => {
    const response = await infraIpListWorker.fetch(
      new Request('https://workers.example/infra-ip-list', {
        method: 'POST',
      }),
      { BOTBASE_SHARED_TOKEN: 'shared-token' },
    );

    expect(response.status).toBe(405);
  });
});
