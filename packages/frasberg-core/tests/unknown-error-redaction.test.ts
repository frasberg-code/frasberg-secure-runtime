import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';
import { errorMiddleware } from '../src/error-middleware';

describe('unknown error redaction', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/boom', () => {
    throw new Error(
      'connect failed postgres://admin:hunter2@db.internal password=hunter2',
    );
  });
  app.use(errorMiddleware);

  test('returns generic message and leaks nothing', async () => {
    const response = await request(app).get('/boom');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.error.message).toBe('Unexpected internal error.');
    const body = JSON.stringify(response.body);
    expect(body).not.toContain('postgres://');
    expect(body).not.toContain('password');
    expect(body).not.toContain('hunter2');
    expect(body).not.toContain('stack');
  });
});
