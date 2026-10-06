import { describe, expect, it } from 'vitest';
import { HealthMonitor, pickTarget } from '../src';
import { RateLimiter } from '../../luchii-rate-limiter/src';
import { LuchiiModelRouter } from '../../luchii-model-router/src';

describe('luchii-health', () => {
  it('marks offline services as 503 service_unavailable and fails over', async () => {
    const m = new HealthMonitor();
    m.register('primary', async () => {
      throw new Error('down');
    });
    m.register('backup', async () => 'ok');
    await m.refresh();
    expect(m.get('primary')?.status).toBe('offline');
    expect(m.unavailable('primary')).toMatchObject({
      status: 503,
      body: { success: false, error: { code: 'SERVICE_UNAVAILABLE' } },
    });
    expect(pickTarget(m, ['primary', 'backup'])).toBe('backup');
    expect(m.overall()).toBe('degraded');
  });
});

describe('luchii-rate-limiter', () => {
  it('limits within a window and resets after it', () => {
    let t = 0;
    const l = new RateLimiter(2, 1000, () => t);
    expect(l.check('k').allowed).toBe(true);
    expect(l.check('k').allowed).toBe(true);
    expect(l.check('k')).toMatchObject({ allowed: false, retryAfterMs: 1000 });
    t = 1000;
    expect(l.check('k').allowed).toBe(true);
  });
});

describe('luchii-model-router', () => {
  it('routes by intent and defaults to chat', () => {
    const r = new LuchiiModelRouter();
    expect(r.route('write a melody')).toBe('luchii-music');
    expect(r.route('describe this image')).toBe('luchii-vision');
    expect(r.route('hello')).toBe('luchii-chat');
  });
});
