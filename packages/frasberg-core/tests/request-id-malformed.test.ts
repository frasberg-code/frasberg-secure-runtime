import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';

describe('malformed request ids', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/test', (req: any, res) => res.json({ requestId: req.requestId }));

  test.each(['../../../etc/passwd', '<script>', 'no_prefix_12345678', 'req_short', 'req_bad id with spaces'])('replaces %s', async (bad) => {
    const response = await request(app).get('/test').set('x-request-id', bad);
    expect(response.body.requestId).not.toBe(bad);
    expect(response.body.requestId).toMatch(/^req_[a-zA-Z0-9_-]{8,128}$/);
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });
});
