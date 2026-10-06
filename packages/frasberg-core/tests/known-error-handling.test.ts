import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { FrasbergError, errorMiddleware } from '../src/error-middleware';
import { ErrorCode } from '../src/error-codes';

describe('known errors', () => {
  const app = express();
  app.get('/test', () => {
    throw new FrasbergError(403, ErrorCode.PERMISSION_DENIED, 'Permission denied.');
  });
  app.use(errorMiddleware);

  test('returns known error message', async () => {
    const response = await request(app).get('/test');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('PERMISSION_DENIED');
    expect(response.body.error.message).toBe('Permission denied.');
  });
});
