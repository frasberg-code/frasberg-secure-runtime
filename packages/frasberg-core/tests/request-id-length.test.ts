import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';

describe('request id length limits', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/test', (req: any, res) => res.json({ requestId: req.requestId }));

  test('accepts a 128 char suffix', async () => {
    const id = 'req_' + 'A'.repeat(128);
    const response = await request(app).get('/test').set('x-request-id', id);
    expect(response.body.requestId).toBe(id);
  });

  test('replaces an oversized id', async () => {
    const id = 'req_' + 'A'.repeat(129);
    const response = await request(app).get('/test').set('x-request-id', id);
    expect(response.body.requestId).not.toBe(id);
    expect(response.body.requestId).toMatch(/^req_/);
  });
});
