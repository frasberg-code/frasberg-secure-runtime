import { describe, expect, it, vi } from 'vitest';
import {
  FrasbergClient,
  FrasbergGateway,
  type FrasbergGatewayKeys,
  resolveFrasbergEndpoints,
  resolveFrasbergGatewayKeys,
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

  it('uses configured absolute endpoint URLs', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ ok: true }));
    const client = new FrasbergClient({ fetchImpl: fetchImpl as typeof fetch });

    await client.request(
      'POST',
      'https://frasberg.com/api/generate/music',
      'music-key',
      { prompt: 'hello' },
    );

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://frasberg.com/api/generate/music',
      expect.any(Object),
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
      FRASBERG_IMAGE_KEY: 'image-key',
      FRASBERG_VOICE_KEY: 'voice-key',
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

  it('routes image and voice jobs through their domain-specific credentials', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ job_id: 'job-1', state: 'queued' }),
    );
    const gateway = new FrasbergGateway(
      new FrasbergClient({ fetchImpl: fetchImpl as typeof fetch }),
      {
        FRASBERG_IMAGE_KEY: 'image-key',
        FRASBERG_VOICE_KEY: 'voice-key',
      },
    );

    await gateway.image({ prompt: 'image' });
    await gateway.voice({ prompt: 'voice' });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://frasberg.com/api/image',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer image-key',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://frasberg.com/api/voice',
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: 'Bearer voice-key',
        }),
      }),
    );
  });

  it('routes provider requests to configured domain endpoints', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ job_id: 'job-1', state: 'queued' }),
    );
    const gateway = new FrasbergGateway(
      new FrasbergClient({ fetchImpl: fetchImpl as typeof fetch }),
      {
        FRASBERG_MUSIC_KEY: 'music-key',
        FRASBERG_VIDEO_KEY: 'video-key',
      },
      {
        music: 'https://frasberg.com/api/generate/music',
        video: 'https://frasberg.com/api/generate/video',
      },
    );

    await gateway.music({ prompt: 'music' });
    await gateway.video({ prompt: 'video' });

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://frasberg.com/api/generate/music',
      expect.any(Object),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://frasberg.com/api/generate/video',
      expect.any(Object),
    );
  });

  it('maps the consolidated engine secret and lets explicit keys override it', () => {
    const resolved = resolveFrasbergGatewayKeys({
      FRASBERG_ENGINE_KEYS_JSON: JSON.stringify({
        FRB_MUSIC_GENERATION_KEY: 'music-from-secret',
        FRB_IMAGE_VIDEO_GENERATION_KEY: 'image-video-from-secret',
        FRB_VOICE_CLONING_KEY: 'voice-from-secret',
      }),
      FRASBERG_MUSIC_KEY: 'music-override',
      FRASBERG_IMAGE_KEY: '',
    } as NodeJS.ProcessEnv);

    expect(resolved).toMatchObject({
      FRASBERG_MUSIC_KEY: 'music-override',
      FRASBERG_VIDEO_KEY: 'image-video-from-secret',
      FRASBERG_IMAGE_KEY: 'image-video-from-secret',
      FRASBERG_VOICE_KEY: 'voice-from-secret',
    });
  });

  it('fails startup for malformed consolidated engine-key JSON', () => {
    expect(() =>
      resolveFrasbergGatewayKeys({
        FRASBERG_ENGINE_KEYS_JSON: 'not-json',
      } as NodeJS.ProcessEnv),
    ).toThrow('FRASBERG_ENGINE_KEYS_JSON must contain valid JSON.');
  });

  it('maps configured route URLs to engine domains', () => {
    expect(
      resolveFrasbergEndpoints({
        FRASBERG_VIDEO_URL: 'https://frasberg.com/api/generate/video',
        FRASBERG_IMAGE_URL: 'https://frasberg.com/api/generate/image',
        FRASBERG_MUSIC_URL: 'https://frasberg.com/api/generate/music',
        FRASBERG_AUDIO_TOOLS_URL: 'https://frasberg.com/api/audio/tools',
        FRASBERG_VOICE_CLONE_URL: 'https://frasberg.com/api/voice/clone',
        FRASBERG_STT_URL: 'https://frasberg.com/api/stt',
        FRASBERG_TTS_URL: 'https://frasberg.com/api/tts',
      } as NodeJS.ProcessEnv),
    ).toEqual({
      music: 'https://frasberg.com/api/generate/music',
      video: 'https://frasberg.com/api/generate/video',
      image: 'https://frasberg.com/api/generate/image',
      audio: 'https://frasberg.com/api/audio/tools',
      voice: 'https://frasberg.com/api/voice/clone',
      stt: 'https://frasberg.com/api/stt',
      tts: 'https://frasberg.com/api/tts',
    });
  });
});
