export type StudioJobState = 'queued' | 'running' | 'completed' | 'failed';
export type StudioDomain =
  'music' | 'video' | 'image' | 'voice' | 'stt' | 'tts' | 'audio';

export interface StudioJobResponse {
  id?: string;
  job_id?: string;
  state?: StudioJobState;
  status?: StudioJobState;
  [key: string]: unknown;
}

export interface CreativeStudio {
  createMusic(payload: unknown): Promise<StudioJobResponse>;
  createVideo(payload: unknown): Promise<StudioJobResponse>;
  createImage(payload: unknown): Promise<StudioJobResponse>;
  createVoice(payload: unknown): Promise<StudioJobResponse>;
  createStt(payload: unknown): Promise<StudioJobResponse>;
  createTts(payload: unknown): Promise<StudioJobResponse>;
  createAudio(payload: unknown): Promise<StudioJobResponse>;
  pollJob(
    jobId: string,
    options?: { domain?: StudioDomain },
  ): Promise<StudioJobResponse>;
}

export interface CreativeStudioOptions {
  backendBaseUrl: string;
  apiKey: string;
  tenantId?: string;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  fetchImpl?: typeof fetch;
}

export class BackendCreativeStudio implements CreativeStudio {
  private readonly backendBaseUrl: string;
  private readonly apiKey: string;
  private readonly tenantId?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;

  constructor(options: CreativeStudioOptions) {
    if (!options.backendBaseUrl || !options.apiKey) {
      throw new Error('Studio backend URL and API key are required.');
    }
    const backendUrl = new URL(options.backendBaseUrl);
    if (
      !['http:', 'https:'].includes(backendUrl.protocol) ||
      backendUrl.username !== '' ||
      backendUrl.password !== ''
    ) {
      throw new Error(
        'Studio backend URL must be an HTTP(S) URL without credentials.',
      );
    }
    this.backendBaseUrl = options.backendBaseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.tenantId = options.tenantId;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.maxPollAttempts = options.maxPollAttempts ?? 120;
    if (!Number.isInteger(this.pollIntervalMs) || this.pollIntervalMs < 0) {
      throw new Error('pollIntervalMs must be a non-negative integer.');
    }
    if (!Number.isInteger(this.maxPollAttempts) || this.maxPollAttempts < 1) {
      throw new Error('maxPollAttempts must be a positive integer.');
    }
  }

  createMusic(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/music', payload);
  }

  createVideo(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/video', payload);
  }

  createImage(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/image', payload);
  }

  createVoice(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/voice', payload);
  }

  createStt(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/stt', payload);
  }

  createTts(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/tts', payload);
  }

  createAudio(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/audio', payload);
  }

  async pollJob(
    jobId: string,
    options: { domain?: StudioDomain } = {},
  ): Promise<StudioJobResponse> {
    if (!jobId.trim()) {
      throw new Error('jobId is required.');
    }
    for (let attempt = 0; attempt < this.maxPollAttempts; attempt += 1) {
      const response = await this.getJob(jobId, options.domain);
      const state = normalizeState(response);

      if (state === 'completed' || state === 'failed') {
        return response;
      }

      if (attempt + 1 < this.maxPollAttempts) {
        await wait(this.pollIntervalMs);
      }
    }

    throw new Error(
      `Job ${jobId} did not reach a terminal state after ${this.maxPollAttempts} polls.`,
    );
  }

  private async getJob(jobId: string, domain?: StudioDomain) {
    const search = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    return this.request(`/api/jobs/${encodeURIComponent(jobId)}${search}`, {
      method: 'GET',
    });
  }

  private async post(path: string, payload: unknown) {
    const body = JSON.stringify(payload);
    if (body === undefined) {
      throw new Error('Studio request payload must be JSON serializable.');
    }
    return this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
  }

  private async request(path: string, init: RequestInit) {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${this.apiKey}`);
    if (this.tenantId) {
      headers.set('x-tenant-id', this.tenantId);
    }
    const response = await this.fetchImpl(`${this.backendBaseUrl}${path}`, {
      ...init,
      headers,
    });
    const responseText = await response.text();
    let body: unknown;
    try {
      body = responseText.length > 0 ? JSON.parse(responseText) : undefined;
    } catch {
      throw new Error(
        `Studio backend returned invalid JSON (HTTP ${response.status}).`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `Backend request failed (${response.status}): ${JSON.stringify(body)}`,
      );
    }
    if (!isRecord(body)) {
      throw new Error('Studio backend returned an invalid job response.');
    }
    return body as StudioJobResponse;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeState(
  response: StudioJobResponse,
): StudioJobState | undefined {
  const state = response.state ?? response.status;
  if (
    state === 'queued' ||
    state === 'running' ||
    state === 'completed' ||
    state === 'failed'
  ) {
    return state;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
