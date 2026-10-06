import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';

describe('generated request ids', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/ping', (req: any, res) => res.json({ requestId: req.requestId }));

  test('generates request id automatically', async () => {
    const response = await request(app).get('/ping');
    expect(response.status).toBe(200);
    expect(response.body.requestId).toMatch(/^req_/);
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });
});
