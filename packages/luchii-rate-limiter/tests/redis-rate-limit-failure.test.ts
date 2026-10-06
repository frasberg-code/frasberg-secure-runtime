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

  test('returns 500 RATE_LIMIT_FAILURE when redis fails', async () => {
    const response = await request(app).get('/limited');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('RATE_LIMIT_FAILURE');
  });
});
