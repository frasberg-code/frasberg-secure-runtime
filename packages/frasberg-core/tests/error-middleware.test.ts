import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { FrasbergError, errorMiddleware } from '../src/error-middleware';
import { ErrorCode } from '../src/error-codes';
import { requestIdMiddleware } from '../src/request-id';

describe('typed error middleware', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/test', () => {
    throw new FrasbergError(
      403,
      ErrorCode.PERMISSION_DENIED,
      'Permission denied.',
    );
  });
  app.get('/boom', () => {
    throw new Error('internal detail');
  });
  app.use(errorMiddleware);

  test('returns typed error', async () => {
    const response = await request(app)
      .get('/test')
      .set('x-request-id', 'req_t1');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('PERMISSION_DENIED');
    expect(response.body.requestId).toBe('req_t1');
  });

  test('hides unexpected error details', async () => {
    const response = await request(app).get('/boom');
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('internal detail');
  });
});
