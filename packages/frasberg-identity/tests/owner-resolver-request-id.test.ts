import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '@frasberg/core';
import { ownerResolver } from '../src/resolvers';

describe('owner resolver request id', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/owner', ownerResolver, (_req, res) => res.json({ success: true }));

  test('error body carries the request id', async () => {
    const response = await request(app)
      .get('/owner')
      .set('x-request-id', 'req_abc12345');
    expect(response.status).toBe(401);
    expect(response.body.requestId).toBe('req_abc12345');
  });
});
