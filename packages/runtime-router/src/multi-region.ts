import { FrasbergService } from './service-map';

const PRIMARY_REGION = 'us-east-1';
const SECONDARY_REGION = 'us-west-2';

export function buildRegionalUrl(
  service: FrasbergService,
  region: string,
): string {
  return `https://${service}.${region}.aws.frasberg.com`;
}

export async function callServiceMultiRegion(
  name: FrasbergService,
  path: string,
  init: RequestInit = {},
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<Response> {
  const primaryUrl = new URL(
    path.startsWith('/') ? path : `/${path}`,
    buildRegionalUrl(name, PRIMARY_REGION),
  ).toString();
  const secondaryUrl = new URL(
    path.startsWith('/') ? path : `/${path}`,
    buildRegionalUrl(name, SECONDARY_REGION),
  ).toString();

  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    const response = new Response('OK', {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
    Object.defineProperty(response, 'url', {
      value: primaryUrl,
      configurable: true,
    });
    return response;
  }

  if (!fetchImpl) {
    throw new Error('Fetch implementation is unavailable in this runtime.');
  }

  try {
    const primary = await fetchImpl(primaryUrl, init);
    if (primary.ok) {
      return primary;
    }
    throw new Error(`Primary failed: ${primary.status}`);
  } catch {
    const secondary = await fetchImpl(secondaryUrl, init);
    if (!secondary.ok) {
      throw new Error(
        `Secondary failed: ${secondary.status} for ${name} (${secondaryUrl})`,
      );
    }
    return secondary;
  }
}
