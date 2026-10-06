import request from 'supertest';
import express from 'express';
import { describe, test, expect, vi } from 'vitest';

vi.mock('../src/redis-client', () => ({
  redis: {
    incr: async () => {
      throw new Error('redis down');
    },
    expire: async () => 1,
  },
}));

import { redisRateLimit } from '../src/redis-rate-limit';

describe('redisRateLimit failure', () => {
  const app = express();
  app.use((req: any, _res, next) => {
    req.ownerId = 'owner_test';
    next();
  });
  app.get('/limited', redisRateLimit(2, 60), (_req, res) => {
    res.json({ success: true });
  });
  app.get(
    '/admin',
    redisRateLimit(2, 60, { failClosed: true }),
    (_req, res) => {
      res.json({ success: true });
    },
  );

  test('fails open when redis fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).get('/limited');
    spy.mockRestore();
    expect(response.status).toBe(200);
  });

  test('fails closed with 503 when configured', async () => {
    const response = await request(app).get('/admin');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('RATE_LIMIT_SERVICE_UNAVAILABLE');
  });
});
