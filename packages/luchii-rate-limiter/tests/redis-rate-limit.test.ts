import request from 'supertest';
import express from 'express';
import { describe, test, expect, beforeEach, vi } from 'vitest';

const mockRedis = vi.hoisted(() => ({
  store: new Map<string, number>(),
  async incr(key: string) {
    const value = (this.store.get(key) || 0) + 1;
    this.store.set(key, value);
    return value;
  },
  async expire() {
    return 1;
  },
  reset() {
    this.store.clear();
  },
}));

vi.mock('../src/redis-client', () => ({ redis: mockRedis }));

import { redisRateLimit } from '../src/redis-rate-limit';

describe('redisRateLimit', () => {
  beforeEach(() => mockRedis.reset());

  const app = express();
  app.use((req: any, _res, next) => {
    req.ownerId = 'owner_test';
    next();
  });
  app.get('/limited', redisRateLimit(2, 60), (_req, res) => {
    res.json({ success: true });
  });

  test('allows requests under limit', async () => {
    expect((await request(app).get('/limited')).status).toBe(200);
    expect((await request(app).get('/limited')).status).toBe(200);
  });

  test('blocks requests above limit', async () => {
    await request(app).get('/limited');
    await request(app).get('/limited');
    const response = await request(app).get('/limited');
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
