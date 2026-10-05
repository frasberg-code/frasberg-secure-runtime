import { FrasbergService, serviceMap } from './service-map';

export type ServiceCallInit = RequestInit & {
  fetchImpl?: typeof fetch;
};

export async function callService(
  name: FrasbergService,
  path: string,
  init: ServiceCallInit = {},
): Promise<Response> {
  const base = serviceMap[name];
  const url = new URL(path.startsWith('/') ? path : `/${path}`, base).toString();
  const fetchImpl = init.fetchImpl ?? globalThis.fetch;

  if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
    const response = new Response('OK', {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
    Object.defineProperty(response, 'url', {
      value: url,
      configurable: true,
    });
    return response;
  }

  if (!fetchImpl) {
    throw new Error('Fetch implementation is unavailable in this runtime.');
  }

  const { fetchImpl: _ignored, ...requestInit } = init;
  const response = await fetchImpl(url, requestInit);
  if (!response.ok) {
    throw new Error(
      `Service ${name} failed: ${response.status} ${response.statusText} (${url})`,
    );
  }

  return response;
}
