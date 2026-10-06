import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';
import { errorMiddleware } from '../src/error-middleware';

describe('unknown error handling', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/boom', () => {
    throw new Error('Unexpected failure');
  });
  app.use(errorMiddleware);

  test('returns standardized 500', async () => {
    const response = await request(app).get('/boom');
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.requestId).toBeDefined();
  });
});
