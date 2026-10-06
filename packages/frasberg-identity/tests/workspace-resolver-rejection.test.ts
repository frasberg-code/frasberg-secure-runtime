import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { workspaceResolver } from '../src/resolvers';

describe('workspace resolver rejection', () => {
  const app = express();
  app.get('/workspace', workspaceResolver, (_req, res) =>
    res.json({ success: true }),
  );

  test('rejects missing workspace', async () => {
    const response = await request(app).get('/workspace');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('WORKSPACE_NOT_FOUND');
  });

  test('rejects invalid workspace', async () => {
    const response = await request(app)
      .get('/workspace')
      .set('x-workspace-id', 'bad');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_WORKSPACE_ID');
  });

  test('rejects blank workspace', async () => {
    const response = await request(app)
      .get('/workspace')
      .set('x-workspace-id', ' ');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_WORKSPACE_ID');
  });

  test('accepts a valid workspace', async () => {
    const response = await request(app)
      .get('/workspace')
      .set('x-workspace-id', 'ws_primary');
    expect(response.status).toBe(200);
  });
});
