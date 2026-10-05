export interface ProviderJob {
  jobId: string;
  status: string;
  result?: unknown;
  error?: string;
}

type FetchLike = typeof fetch;

// Maps adapter calls onto the real Luchii backend contract:
// /voice/speak (JSON), /voice/transcribe (multipart), /audio/tools/enhance (JSON {url, mode}).
export class LuchiiAdapter {
  constructor(
    private readonly baseUrl: string,
    private readonly key: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/+$/, '')}${path}`;
  }

  private async finish(res: Response): Promise<ProviderJob> {
    const contentType = res.headers.get('content-type') ?? '';
    const body = contentType.includes('json')
      ? await res.json().catch(() => undefined)
      : undefined;
    if (!res.ok) {
      const detail =
        body && typeof body === 'object' && 'detail' in body
          ? String((body as { detail: unknown }).detail)
          : `HTTP ${res.status}`;
      return { jobId: 'none', status: 'failed', error: detail };
    }
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      return {
        jobId: String(record.jobId ?? record.task_id ?? record.id ?? 'sync'),
        status: String(record.status ?? 'completed'),
        result: body,
      };
    }
    return {
      jobId: 'sync',
      status: 'completed',
      result: { contentType, bytes: (await res.arrayBuffer()).byteLength },
    };
  }

  private async postJson(path: string, payload: unknown): Promise<ProviderJob> {
    try {
      return await this.finish(
        await this.fetchImpl(this.url(path), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.key}`,
          },
          body: JSON.stringify(payload),
        }),
      );
    } catch (error) {
      return { jobId: 'none', status: 'failed', error: (error as Error).message };
    }
  }

  voice(text: string, voiceId?: string) {
    return this.tts(text, voiceId);
  }

  tts(text: string, voiceId?: string) {
    return this.postJson('/api/voice/speak', { text, voice: voiceId });
  }

  async stt(audioUrl: string): Promise<ProviderJob> {
    try {
      const source = await this.fetchImpl(audioUrl);
      if (!source.ok) {
        return {
          jobId: 'none',
          status: 'failed',
          error: `Audio fetch failed: HTTP ${source.status}`,
        };
      }
      const form = new FormData();
      form.append('file', await source.blob(), 'audio.mp3');
      return await this.finish(
        await this.fetchImpl(this.url('/api/voice/transcribe'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.key}` },
          body: form,
        }),
      );
    } catch (error) {
      return { jobId: 'none', status: 'failed', error: (error as Error).message };
    }
  }

  audioEnhance(audioUrl: string, mode = 'enhance') {
    return this.postJson('/api/audio/tools/enhance', { url: audioUrl, mode });
  }
}
