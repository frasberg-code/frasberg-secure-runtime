import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';

describe('request id middleware', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/test', (req: any, res) => res.json({ requestId: req.requestId }));

  test('generates request id', async () => {
    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body.requestId).toBeDefined();
  });

  test('propagates caller request id', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-request-id', 'req_external_123');
    expect(response.headers['x-request-id']).toBe('req_external_123');
    expect(response.body.requestId).toBe('req_external_123');
  });
});
