import { failoverFetch } from './failover';
import type { FailoverOptions } from './failover';
import { signRequest } from './signer';

export interface FrasbergOptions {
  key: string;
  baseUrls?: readonly string[];
  tenantId?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class Frasberg {
  private readonly baseUrls: readonly string[];
  private readonly timeoutMs: number;

  constructor(private readonly options: FrasbergOptions) {
    if (!options.key) {
      throw new Error('Frasberg API key is required.');
    }
    this.baseUrls = options.baseUrls ?? ['https://frasberg.com/api'];
    if (this.baseUrls.length === 0) {
      throw new Error('At least one Frasberg API base URL is required.');
    }
    this.timeoutMs = options.timeoutMs ?? 15_000;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1) {
      throw new Error('timeoutMs must be a positive integer.');
    }
  }

  async request<TResponse>(
    path: string,
    body?: unknown,
    options: { method?: 'GET' | 'POST'; signal?: AbortSignal } = {},
  ): Promise<TResponse> {
    const method = options.method ?? (body === undefined ? 'GET' : 'POST');
    if (method === 'GET' && body !== undefined) {
      throw new Error('GET requests cannot include a request body.');
    }
    const serializedBody =
      body === undefined ? undefined : JSON.stringify(body);
    const headers = new Headers({
      authorization: `Bearer ${this.options.key}`,
      accept: 'application/json',
    });
    if (serializedBody !== undefined) {
      headers.set('content-type', 'application/json');
      headers.set(
        'x-api-signature',
        signRequest(this.options.key, serializedBody),
      );
    }
    if (this.options.tenantId) {
      headers.set('x-tenant-id', this.options.tenantId);
    }

    const requestOptions: FailoverOptions = {
      method,
      headers,
      signal: options.signal ?? AbortSignal.timeout(this.timeoutMs),
      fetchImpl: this.options.fetchImpl,
      ...(serializedBody === undefined ? {} : { body: serializedBody }),
    };
    const response = await failoverFetch(this.baseUrls, path, requestOptions);
    const text = await response.text();
    let payload: unknown;
    try {
      payload = text.length > 0 ? JSON.parse(text) : undefined;
    } catch {
      throw new Error(
        `Frasberg returned invalid JSON (${response.status}) from ${response.url}.`,
      );
    }
    if (!response.ok) {
      throw new FrasbergApiError(response.status, payload);
    }
    return payload as TResponse;
  }
}

export class FrasbergApiError extends Error {
  constructor(
    readonly status: number,
    readonly payload: unknown,
  ) {
    super(`Frasberg request failed with HTTP ${status}.`);
    this.name = 'FrasbergApiError';
  }
}
