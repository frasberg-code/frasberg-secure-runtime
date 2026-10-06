import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { FrasbergTtsProvider } from '../FrasbergTtsProvider';

// Calls the Frasberg /api/tts route (JSON {text, voice}) and stores the returned audio
// in EXPORT_DIR. Returns a public URL when EXPORT_PUBLIC_BASE_URL is set, else the file path.
export class LuchiiTtsProvider implements FrasbergTtsProvider {
  constructor(
    private readonly speakUrl: string,
    private readonly key: string,
    private readonly voice?: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async synthesize(text: string): Promise<string> {
    const res = await this.fetchImpl(this.speakUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.key}` },
      body: JSON.stringify({ text, ...(this.voice ? { voice: this.voice } : {}) }),
    });
    if (!res.ok) throw new Error(`TTS failed: HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (type.includes('json')) {
      const body = (await res.json()) as { audio_url?: string; url?: string };
      const url = body.audio_url ?? body.url;
      if (!url) throw new Error('TTS response had no audio url');
      return url;
    }
    const dir = process.env.EXPORT_DIR ?? join(process.cwd(), 'exports');
    await mkdir(dir, { recursive: true });
    const name = `tts-${randomUUID()}.wav`;
    const path = join(dir, name);
    await writeFile(path, Buffer.from(await res.arrayBuffer()));
    const base = process.env.EXPORT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
    return base ? `${base}/${name}` : path;
  }
}