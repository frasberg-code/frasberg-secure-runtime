import request from 'supertest';
import express from 'express';
import { describe, test, expect, vi } from 'vitest';
import { requestIdMiddleware } from '../src/request-id';
import { requestLogger } from '../src/request-logger';

describe('request logger redaction', () => {
  test('never logs credentials', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const app = express();
    app.use(requestIdMiddleware);
    app.use(requestLogger);
    app.get('/x', (_req, res) => res.json({ ok: true }));

    await request(app)
      .get('/x')
      .set('authorization', 'Bearer super-secret')
      .set('x-api-key', 'luc_live_secret');

    const logged = spy.mock.calls.map((c) => String(c[0])).join('\n');
    spy.mockRestore();
    expect(logged).not.toContain('super-secret');
    expect(logged).not.toContain('luc_live_secret');
  });
});
