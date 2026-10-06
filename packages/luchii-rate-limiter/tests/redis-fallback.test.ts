import request from 'supertest';
import express from 'express';
import { vi, describe, test, expect } from 'vitest';

vi.mock('../src/redis-client', () => ({
  redis: { incr: vi.fn().mockRejectedValue(new Error('redis offline')) },
}));

import { redisRateLimit } from '../src/redis-rate-limit';

describe('redis fallback', () => {
  const app = express();
  app.use((req: any, _res, next) => {
    req.ownerId = 'owner_1';
    next();
  });
  app.get('/test', redisRateLimit(), (_req, res) => {
    res.json({ success: true });
  });

  test('continues processing when redis fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).get('/test');
    spy.mockRestore();
    expect(response.status).toBe(200);
  });
});
