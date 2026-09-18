import { describe, expect, it, vi } from 'vitest';
import {
  FrasbergClient,
  FrasbergGateway,
  type FrasbergGatewayKeys,
} from '../src/frasberg';

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('FrasbergClient', () => {
  it('uses the unified base URL and bearer authorization', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new FrasbergClient({ fetchImpl: fetchImpl as typeof fetch });

    await client.request('POST', '/music', 'music-key', { prompt: 'hello' });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://frasberg.com/api/music',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: ['Bearer', 'music-key'].join(' '),
        }),
      }),
    );
  });
});

describe('FrasbergGateway', () => {
  it('tracks job domain and uses domain-specific key for polling', async () => {
    const fetchImpl = vi
      .fn()
      .mockImplementationOnce(async () =>
        jsonResponse({ job_id: 'job-1', state: 'queued' }),
      )
      .mockImplementationOnce(async () =>
        jsonResponse({ id: 'job-1', state: 'running' }),
      );

    const keys: FrasbergGatewayKeys = {
      FRASBERG_MUSIC_KEY: 'music-key',
      FRASBERG_VIDEO_KEY: 'video-key',
      FRASBERG_STT_KEY: 'stt-key',
      FRASBERG_TTS_KEY: 'tts-key',
      FRASBERG_AUDIO_KEY: 'audio-key',
    };
    const gateway = new FrasbergGateway(
      new FrasbergClient({ fetchImpl: fetchImpl as typeof fetch }),
      keys,
    );

    await gateway.music({ prompt: 'generate song' });
    await gateway.job('job-1');

    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://frasberg.com/api/jobs/job-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: ['Bearer', 'music-key'].join(' '),
        }),
      }),
    );
  });

  it('throws when a required domain key is missing', async () => {
    const gateway = new FrasbergGateway(
      new FrasbergClient({ fetchImpl: vi.fn() as unknown as typeof fetch }),
      {},
    );

    await expect(gateway.video({ prompt: 'clip' })).rejects.toThrow(
      'FRASBERG_VIDEO_KEY',
    );
  });
});
