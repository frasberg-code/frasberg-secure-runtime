export type FrasbergDomain = 'music' | 'video' | 'stt' | 'tts' | 'audio';

export type FrasbergJobState = 'queued' | 'running' | 'completed' | 'failed';

export interface FrasbergGatewayKeys {
  FRASBERG_MUSIC_KEY?: string;
  FRASBERG_VIDEO_KEY?: string;
  FRASBERG_STT_KEY?: string;
  FRASBERG_TTS_KEY?: string;
  FRASBERG_AUDIO_KEY?: string;
}

export interface FrasbergClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export class FrasbergClient {
  readonly baseUrl: string;

  constructor(private readonly options: FrasbergClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://frasberg.com/api';
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
    const response = await fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        authorization: ['Bearer', key].join(' '),
        ...(payload === undefined
          ? {}
          : { 'content-type': 'application/json' }),
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });

    const body = (await response.json()) as TResponse;
    if (!response.ok) {
      throw new Error(
        `Frasberg request failed (${response.status}): ${JSON.stringify(body)}`,
      );
    }
    return body;
  }
}

const DOMAIN_KEY_MAP: Record<FrasbergDomain, keyof FrasbergGatewayKeys> = {
  music: 'FRASBERG_MUSIC_KEY',
  video: 'FRASBERG_VIDEO_KEY',
  stt: 'FRASBERG_STT_KEY',
  tts: 'FRASBERG_TTS_KEY',
  audio: 'FRASBERG_AUDIO_KEY',
};

export class FrasbergGateway {
  private readonly jobDomains = new Map<string, FrasbergDomain>();

  constructor(
    private readonly client: FrasbergClient,
    private readonly keys: FrasbergGatewayKeys,
  ) {}

  static fromEnv(options: FrasbergClientOptions = {}): FrasbergGateway {
    return new FrasbergGateway(
      new FrasbergClient(options),
      resolveFrasbergGatewayKeys(),
    );
  }

  async music<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('music', '/music', payload);
  }

  async video<TResponse>(payload: unknown): Promise<TResponse> {
    return this.submit<TResponse>('video', '/video', payload);
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
    options: { domain?: FrasbergDomain } = {},
  ): Promise<TResponse> {
    const domain = options.domain ?? this.jobDomains.get(id) ?? 'music';
    return this.client.request('GET', `/jobs/${id}`, this.keyFor(domain));
  }

  private async submit<TResponse>(
    domain: FrasbergDomain,
    path: string,
    payload: unknown,
  ): Promise<TResponse> {
    const response = await this.client.request<TResponse>(
      'POST',
      path,
      this.keyFor(domain),
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
  return {
    FRASBERG_MUSIC_KEY: env.FRASBERG_MUSIC_KEY,
    FRASBERG_VIDEO_KEY: env.FRASBERG_VIDEO_KEY,
    FRASBERG_STT_KEY: env.FRASBERG_STT_KEY,
    FRASBERG_TTS_KEY: env.FRASBERG_TTS_KEY,
    FRASBERG_AUDIO_KEY: env.FRASBERG_AUDIO_KEY,
  };
}

function extractJobId(response: unknown): string | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  const jobId = record.job_id ?? record.id;
  return typeof jobId === 'string' ? jobId : undefined;
}
