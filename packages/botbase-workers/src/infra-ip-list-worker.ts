import { authenticateWorkerRequest, json } from './lib';
import type { WorkerEnv } from './types';

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (request.method !== 'GET') {
      return json({ error: 'Only GET is supported.' }, 405);
    }

    const auth = await authenticateWorkerRequest(request, env);
    if (!auth.ok) {
      return auth.response;
    }

    const configuredCidrs = env.BOTBASE_INFRA_IP_CIDRS;
    if (!configuredCidrs) {
      return json(
        { error: 'Infrastructure CIDR configuration is unavailable.' },
        503,
      );
    }

    const addresses = configuredCidrs
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean);
    if (
      addresses.length === 0 ||
      addresses.length > 256 ||
      addresses.some((address) => !isIpv4Cidr(address))
    ) {
      return json(
        { error: 'Infrastructure CIDR configuration is invalid.' },
        503,
      );
    }

    return json({
      tenantId: auth.tenantId,
      addresses: [...new Set(addresses)],
    });
  },
};

function isIpv4Cidr(value: string): boolean {
  const [address, prefix, ...extra] = value.split('/');
  if (!address || extra.length > 0) {
    return false;
  }

  const octets = address.split('.');
  if (
    octets.length !== 4 ||
    octets.some(
      (octet) => !/^(0|[1-9]\d{0,2})$/.test(octet) || Number(octet) > 255,
    )
  ) {
    return false;
  }

  if (prefix === undefined) {
    return true;
  }
  return /^(0|[1-9]\d?)$/.test(prefix) && Number(prefix) <= 32;
}
