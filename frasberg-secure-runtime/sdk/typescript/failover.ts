export interface FailoverOptions extends RequestInit {
  fetchImpl?: typeof fetch;
}

export async function failoverFetch(
  baseUrls: readonly string[],
  path: string,
  options: FailoverOptions,
): Promise<Response> {
  if (baseUrls.length === 0) {
    throw new Error('At least one Frasberg API base URL is required.');
  }
  const method = (options.method ?? 'GET').toUpperCase();
  const mayRetry = method === 'GET' || method === 'HEAD';
  const fetchImpl = options.fetchImpl ?? fetch;
  const { fetchImpl: _fetchImpl, ...requestOptions } = options;
  let lastError: Error | undefined;

  for (const baseUrl of baseUrls) {
    const url = resolveUrl(baseUrl, path);
    try {
      const response = await fetchImpl(url, requestOptions);
      if (!mayRetry || ![502, 503, 504].includes(response.status)) {
        return response;
      }
      lastError = new Error(
        `Frasberg upstream returned ${response.status} from ${url}.`,
      );
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error('Frasberg request failed.');
    }
    if (!mayRetry) {
      throw lastError;
    }
  }

  throw lastError ?? new Error('No Frasberg API base URL was attempted.');
}

function resolveUrl(baseUrl: string, path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(
      'Frasberg API path must be an absolute path on the API host.',
    );
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const resolved = new URL(path.slice(1), normalizedBase);
  const base = new URL(normalizedBase);
  const decodedPath = decodeURIComponent(resolved.pathname);
  if (
    (base.protocol !== 'https:' && base.protocol !== 'http:') ||
    base.username !== '' ||
    base.password !== '' ||
    base.search !== '' ||
    base.hash !== '' ||
    resolved.origin !== base.origin ||
    !resolved.pathname.startsWith(base.pathname) ||
    !decodedPath.startsWith(base.pathname)
  ) {
    throw new Error('Frasberg API path cannot escape the configured base URL.');
  }
  return resolved.toString();
}
