export interface RuntimeJob {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

type FetchLike = typeof fetch;

// Single client for all multimodal calls; always goes through the Frasberg runtime.
export class EmergentAgentRuntime {
  constructor(
    protected readonly baseUrl: string,
    protected readonly apiKey: string,
    protected readonly fetchImpl: FetchLike = fetch,
  ) {}

  protected headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async call(path: string, payload: any): Promise<RuntimeJob> {
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return { jobId: 'none', status: 'failed', error: `HTTP ${res.status}` };
      }
      return (await res.json()) as RuntimeJob;
    } catch (error) {
      return { jobId: 'none', status: 'failed', error: (error as Error).message };
    }
  }

  voice(text: string, voiceId?: string) {
    return this.call('/api/voice', { text, voiceId });
  }

  stt(audioUrl: string) {
    return this.call('/api/stt', { audioUrl });
  }

  tts(text: string, voiceId?: string) {
    return this.call('/api/tts', { text, voiceId });
  }

  audioEnhance(audioUrl: string) {
    return this.call('/api/audio', { url: audioUrl, mode: 'enhance' });
  }

  music(payload: any) {
    return this.call('/api/music', payload);
  }

  video(payload: any) {
    return this.call('/api/video', payload);
  }

  image(payload: any) {
    return this.call('/api/image', payload);
  }

  async poll(jobId: string): Promise<RuntimeJob> {
    const res = await this.fetchImpl(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: 'GET',
      headers: this.headers(),
    });
    return (await res.json()) as RuntimeJob;
  }
}
