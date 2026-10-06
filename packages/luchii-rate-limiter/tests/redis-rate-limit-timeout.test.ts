import request from 'supertest';
import express from 'express';
import { describe, test, expect, vi } from 'vitest';

vi.mock('../src/redis-client', () => ({
  redis: {
    incr: () => new Promise<number>(() => {}),
    expire: async () => 1,
  },
}));

import { redisRateLimit } from '../src/redis-rate-limit';

describe('redisRateLimit timeout', () => {
  const app = express();
  app.use((req: any, _res, next) => {
    req.ownerId = 'owner_test';
    next();
  });
  app.get(
    '/limited',
    redisRateLimit(2, 60, { timeoutMs: 50, failClosed: true }),
    (_req, res) => {
      res.json({ success: true });
    },
  );

  test('returns 503 when redis hangs and fail-closed', async () => {
    const response = await request(app).get('/limited');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('RATE_LIMIT_SERVICE_UNAVAILABLE');
  });
});
