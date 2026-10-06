import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';
import { errorMiddleware, FrasbergError } from '../src/error-middleware';
import { ErrorCode } from '../src/error-codes';

describe('request id propagation', () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get('/fail', () => {
    throw new FrasbergError(
      403,
      ErrorCode.PERMISSION_DENIED,
      'Permission denied.',
    );
  });
  app.use(errorMiddleware);

  test('propagates incoming request id', async () => {
    const response = await request(app)
      .get('/fail')
      .set('x-request-id', 'req_external_999');
    expect(response.body.requestId).toBe('req_external_999');
    expect(response.headers['x-request-id']).toBe('req_external_999');
  });
});
