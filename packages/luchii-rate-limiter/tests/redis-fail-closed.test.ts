import request from 'supertest';
import express from 'express';
import { vi, describe, test, expect } from 'vitest';

vi.mock('../src/redis-client', () => ({
  redis: { incr: vi.fn().mockRejectedValue(new Error('Redis offline')) },
}));

import { redisRateLimit } from '../src/redis-rate-limit';

describe('fail closed admin route', () => {
  const app = express();
  app.use((req: any, _res, next) => {
    req.ownerId = 'owner_admin';
    req.requestId = 'req_admin_1';
    next();
  });
  app.get(
    '/admin',
    redisRateLimit(1000, 60, { failClosed: true }),
    (_req, res) => {
      res.json({ success: true });
    },
  );

  test('returns 503 when redis unavailable', async () => {
    const response = await request(app).get('/admin');
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('RATE_LIMIT_SERVICE_UNAVAILABLE');
    expect(response.body.requestId).toBe('req_admin_1');
  });
});
