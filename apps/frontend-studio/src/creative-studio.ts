export type StudioJobState = 'queued' | 'running' | 'completed' | 'failed';
export type StudioDomain = 'music' | 'video' | 'stt' | 'tts' | 'audio';

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
  createStt(payload: unknown): Promise<StudioJobResponse>;
  createTts(payload: unknown): Promise<StudioJobResponse>;
  createAudio(payload: unknown): Promise<StudioJobResponse>;
  pollJob(
    jobId: string,
    options?: { domain?: StudioDomain },
  ): Promise<StudioJobResponse>;
}

export interface CreativeStudioOptions {
  backendBaseUrl?: string;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  fetchImpl?: typeof fetch;
}

export class BackendCreativeStudio implements CreativeStudio {
  private readonly backendBaseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;

  constructor(options: CreativeStudioOptions = {}) {
    this.backendBaseUrl = options.backendBaseUrl ?? '';
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.maxPollAttempts = options.maxPollAttempts ?? 120;
  }

  createMusic(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/music', payload);
  }

  createVideo(payload: unknown): Promise<StudioJobResponse> {
    return this.post('/api/video', payload);
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
    return this.request(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async request(path: string, init: RequestInit) {
    const response = await this.fetchImpl(`${this.backendBaseUrl}${path}`, init);
    const body = (await response.json()) as StudioJobResponse;
    if (!response.ok) {
      throw new Error(
        `Backend request failed (${response.status}): ${JSON.stringify(body)}`,
      );
    }
    return body;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeState(response: StudioJobResponse): StudioJobState | undefined {
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
