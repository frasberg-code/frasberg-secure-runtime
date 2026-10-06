import request from 'supertest';
import express from 'express';
import { describe, test, expect } from 'vitest';
import { ownerResolver } from '../src/resolvers';

describe('owner resolver rejection', () => {
  const app = express();
  app.get('/owner', ownerResolver, (_req, res) => res.json({ success: true }));

  test('rejects missing owner', async () => {
    const response = await request(app).get('/owner');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('OWNER_NOT_FOUND');
  });

  test('rejects invalid owner format', async () => {
    const response = await request(app).get('/owner').set('x-owner-id', '%%%');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OWNER_ID');
  });
});
