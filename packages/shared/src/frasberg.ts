export type FrasbergDomain =
  'music' | 'video' | 'image' | 'voice' | 'stt' | 'tts' | 'audio';

export type FrasbergJobState = 'queued' | 'running' | 'completed' | 'failed';

export interface FrasbergGatewayKeys {
  FRASBERG_MUSIC_KEY?: string;
  FRASBERG_MUSIC_ENGINE_KEY?: string;
  FRASBERG_VIDEO_KEY?: string;
  FRASBERG_VIDEO_ENGINE_KEY?: string;
  FRASBERG_IMAGE_KEY?: string;
  FRASBERG_VOICE_KEY?: string;
  FRASBERG_STT_KEY?: string;
  FRASBERG_TTS_KEY?: string;
  FRASBERG_AUDIO_KEY?: string;
}

export interface FrasbergClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
}

export type FrasbergEndpoints = Partial<Record<FrasbergDomain, string>>;

export interface FrasbergProviderStatus {
  domain: FrasbergDomain;
  keyConfigured: boolean;
  endpoint: string;
  reachable?: boolean;
  endpointStatus?: number;
  keyAccepted?: boolean;
  keyStatus?: number;
  error?: string;
}

export class FrasbergClient {
  readonly baseUrl: string;

  constructor(private readonly options: FrasbergClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://frasberg.com/api';
  }

  resolveUrl(path: string): string {
    return /^https?:\/\//i.test(path) ? path : `${this.baseUrl}${path}`;
  }

  async probe(url: string, key?: string): Promise<number> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: key ? { authorization: ['Bearer', key].join(' ') } : {},
    });
    return response.status;
  }

  async request<TResponse>(
    method: 'GET' | 'POST',
    path: string,
    key: string,
    payload?: unknown,
  ): Promise<TResponse> {
    if (!key) {
      throw new Error('Missing Frasberg API key.');
    }

    const fetchImpl = this.options.fetchImpl ?? fetch;
    const requestUrl = /^https?:\/\//i.test(path)
      ? path
      : `${this.baseUrl}${path}`;
    const isFormData = payload instanceof FormData;
    // Only idempotent reads are retried; retrying a POST could duplicate a job.
    const attempts =
      method === 'GET' ? TRANSIENT_RETRY_DELAYS_MS.length + 1 : 1;
    let response: Response;
    for (let attempt = 0; ; attempt += 1) {
      response = await fetchImpl(requestUrl, {
        method,
        headers: {
          authorization: ['Bearer', key].join(' '),
          ...(payload === undefined || isFormData
            ? {}
            : { 'content-type': 'application/json' }),
        },
        ...(payload === undefined
          ? {}
          : { body: isFormData ? payload : JSON.stringify(payload) }),
      });
      if (
        !TRANSIENT_EDGE_STATUSES.has(response.status) ||
        attempt + 1 >= attempts
      ) {
        break;
      }
      await (this.options.sleepImpl ?? defaultSleep)(
        TRANSIENT_RETRY_DELAYS_MS[attempt] ?? 0,
      );
    }

    const text = await response.text();
    let body: unknown;
    try {
      body = text.length > 0 ? JSON.parse(text) : {};
    } catch {
      // Edge errors (for example Cloudflare 520) return HTML, not JSON.
      body = undefined;
    }
    if (!response.ok) {
      const detail =
        body === undefined
          ? 'non-JSON response from provider edge'
          : JSON.stringify(body);
      throw new Error(
        `Frasberg request failed (${response.status}): ${detail}`,
      );
    }
    if (body === undefined) {
      throw new Error(
        `Frasberg request returned a non-JSON response (${response.status}).`,
      );
    }
    return body as TResponse;
  }
}

const TRANSIENT_EDGE_STATUSES = new Set([
  502, 503, 504, 520, 521, 522, 523, 524,
]);
const TRANSIENT_RETRY_DELAYS_MS = [500, 1500];
const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const DOMAIN_KEY_MAP: Record<FrasbergDomain, keyof FrasbergGatewayKeys> = {
  music: 'FRASBERG_MUSIC_KEY',
  video: 'FRASBERG_VIDEO_KEY',
  image: 'FRASBERG_IMAGE_KEY',
  voice: 'FRASBERG_VOICE_KEY',
  stt: 'FRASBERG_STT_KEY',
  tts: 'FRASBERG_TTS_KEY',
  audio: 'FRASBERG_AUDIO_KEY',
};

export class FrasbergGateway {
  private readonly jobDomains = new Map<string, FrasbergDomain>();

  constructor(
    private readonly client: FrasbergClient,
    private readonly keys: FrasbergGatewayKeys,
    private readonly endpoints: FrasbergEndpoints = {},
  ) {}

  static fromEnv(options: FrasbergClientOptions = {}): FrasbergGateway {
    return new FrasbergGateway(
      new FrasbergClient(options),
      resolveFrasbergGatewayKeys(),
      resolveFrasbergEndpoints(),
    );
  }

  async music<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('music', '/music', payload);
  }

  async video<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('video', '/video', payload);
  }

  async image<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('image', '/image', payload);
  }

  async imageForUser<TResponse>(
    payload: unknown,
    accessToken: string,
  ): Promise<TResponse> {
    return this.submit<TResponse>('image', '/image', payload, accessToken);
  }

  async voice<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('voice', '/voice', payload);
  }

  async stt<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('stt', '/stt', payload);
  }

  async tts<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('tts', '/tts', payload);
  }

  async audio<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('audio', '/audio', payload);
  }

  async job<TResponse>(
    id: string,
    options: { domain?: FrasbergDomain; accessToken?: string } = {},
  ): Promise<TResponse> {
    const domain = options.domain ?? this.jobDomains.get(id) ?? 'music';
    const engineKeyName =
      domain === 'music'
        ? 'FRASBERG_MUSIC_ENGINE_KEY'
        : domain === 'video'
          ? 'FRASBERG_VIDEO_ENGINE_KEY'
          : undefined;
    const engineKey = engineKeyName ? this.keys[engineKeyName] : undefined;
    return this.client.request(
      'GET',
      `/jobs/${id}`,
      options.accessToken ?? engineKey ?? this.keyFor(domain),
    );
  }

  // Read-only: never submits a job and never returns key values.
  async diagnose(): Promise<FrasbergProviderStatus[]> {
    const domains: FrasbergDomain[] = [
      'music',
      'video',
      'image',
      'voice',
      'stt',
      'tts',
      'audio',
    ];
    return Promise.all(
      domains.map(async (domain): Promise<FrasbergProviderStatus> => {
        const keyName = DOMAIN_KEY_MAP[domain];
        const key = this.keys[keyName];
        const endpoint = this.client.resolveUrl(
          this.endpoints[domain] ?? `/${domain}`,
        );
        const status: FrasbergProviderStatus = {
          domain,
          keyConfigured: Boolean(key),
          endpoint,
        };
        try {
          const reach = await this.client.probe(endpoint);
          status.endpointStatus = reach;
          status.reachable = reach < 500;
          if (key) {
            const auth = await this.client.probe(
              this.client.resolveUrl('/jobs/diagnostic-probe'),
              key,
            );
            status.keyAccepted = auth !== 401 && auth !== 403;
            status.keyStatus = auth;
          }
        } catch (error) {
          status.reachable = false;
          status.error = (error as Error).message;
        }
        return status;
      }),
    );
  }

  private async submit<TResponse>(
    domain: FrasbergDomain,
    path: string,
    payload: unknown,
    accessToken?: string,
  ): Promise<TResponse> {
    const response = await this.client.request<TResponse>(
      'POST',
      this.endpoints[domain] ?? path,
      accessToken ?? this.keyFor(domain),
      payload,
    );
    const id = extractJobId(response);
    if (id) {
      this.jobDomains.set(id, domain);
    }
    return response;
  }

  private keyFor(domain: FrasbergDomain): string {
    const keyName = DOMAIN_KEY_MAP[domain];
    const key = this.keys[keyName];
    if (!key) {
      throw new Error(`Missing required environment variable: ${keyName}`);
    }
    return key;
  }
}

export function resolveFrasbergGatewayKeys(
  env: NodeJS.ProcessEnv = process.env,
): FrasbergGatewayKeys {
  const bundledKeys = readBundledEngineKeys(env.FRASBERG_ENGINE_KEYS_JSON);
  return {
    FRASBERG_MUSIC_KEY: preferConfiguredKey(
      env.FRASBERG_MUSIC_KEY,
      bundledKeys.FRASBERG_MUSIC_KEY,
    ),
    FRASBERG_MUSIC_ENGINE_KEY: preferConfiguredKey(
      env.FRASBERG_MUSIC_ENGINE_KEY,
      bundledKeys.FRASBERG_MUSIC_ENGINE_KEY,
    ),
    FRASBERG_VIDEO_KEY: preferConfiguredKey(
      env.FRASBERG_VIDEO_KEY,
      bundledKeys.FRASBERG_VIDEO_KEY,
    ),
    FRASBERG_VIDEO_ENGINE_KEY: preferConfiguredKey(
      env.FRASBERG_VIDEO_ENGINE_KEY,
      bundledKeys.FRASBERG_VIDEO_ENGINE_KEY,
    ),
    FRASBERG_IMAGE_KEY: preferConfiguredKey(
      env.FRASBERG_IMAGE_KEY,
      bundledKeys.FRASBERG_IMAGE_KEY,
    ),
    FRASBERG_VOICE_KEY: preferConfiguredKey(
      env.FRASBERG_VOICE_KEY,
      bundledKeys.FRASBERG_VOICE_KEY,
    ),
    FRASBERG_STT_KEY: preferConfiguredKey(
      env.FRASBERG_STT_KEY,
      bundledKeys.FRASBERG_STT_KEY,
    ),
    FRASBERG_TTS_KEY: preferConfiguredKey(
      env.FRASBERG_TTS_KEY,
      bundledKeys.FRASBERG_TTS_KEY,
    ),
    FRASBERG_AUDIO_KEY: preferConfiguredKey(
      env.FRASBERG_AUDIO_KEY,
      bundledKeys.FRASBERG_AUDIO_KEY,
    ),
  };
}

export function resolveFrasbergEndpoints(
  env: NodeJS.ProcessEnv = process.env,
): FrasbergEndpoints {
  return {
    music: env.FRASBERG_MUSIC_URL,
    video: env.FRASBERG_VIDEO_URL,
    image: env.FRASBERG_IMAGE_URL,
    audio: env.FRASBERG_AUDIO_TOOLS_URL,
    voice: env.FRASBERG_VOICE_CLONE_URL,
    stt: env.FRASBERG_STT_URL,
    tts: env.FRASBERG_TTS_URL,
  };
}

function readBundledEngineKeys(raw: string | undefined): FrasbergGatewayKeys {
  if (!raw) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('FRASBERG_ENGINE_KEYS_JSON must contain valid JSON.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('FRASBERG_ENGINE_KEYS_JSON must contain a JSON object.');
  }

  const keys = parsed as Record<string, unknown>;
  const readKey = (name: string) => {
    const value = keys[name];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  };
  return {
    FRASBERG_MUSIC_KEY: readKey('FRB_MUSIC_GENERATION_KEY'),
    FRASBERG_MUSIC_ENGINE_KEY: readKey('FRB_MUSIC_ENGINE_KEY'),
    FRASBERG_VIDEO_KEY: readKey('FRB_VIDEO_ENGINE_KEY'),
    FRASBERG_VIDEO_ENGINE_KEY: readKey('FRB_VIDEO_ENGINE_KEY'),
    FRASBERG_IMAGE_KEY: readKey('FRB_IMAGE_VIDEO_GENERATION_KEY'),
    FRASBERG_VOICE_KEY: readKey('FRB_VOICE_CLONING_KEY'),
    FRASBERG_STT_KEY: readKey('FRB_GATEWAY_STT_KEY'),
    FRASBERG_TTS_KEY: readKey('FRB_GATEWAY_TTS_KEY'),
    FRASBERG_AUDIO_KEY: readKey('FRB_AUDIO_TOOLS_KEY'),
  };
}

function preferConfiguredKey(
  directValue: string | undefined,
  bundledValue: string | undefined,
): string | undefined {
  return directValue?.trim() ? directValue : bundledValue;
}

function extractJobId(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  const jobId = record.job_id ?? record.id;
  return typeof jobId === 'string' ? jobId : undefined;
}
