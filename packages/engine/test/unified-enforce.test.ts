import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import { unifiedEnforce } from '../src/unified-enforce';

describe('unified engine enforcement', () => {
  it('validates policy and accepts an optional continuity identifier', () => {
    const payload = {
      model: 'test-model',
      messages: [{ role: 'user', content: 'hello' }],
    };

    expect(
      unifiedEnforce({}, 'owner-1', {
        continuity: 'continuity-1',
        requestId: 'request-1',
        policy: payload,
      }),
    ).toEqual(payload);
  });

  it('rejects missing owners, invalid continuity, and invalid policy input', () => {
    const context = {
      requestId: 'request-1',
      policy: {
        model: 'test-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
    };

    expect(() => unifiedEnforce({}, ' ', context)).toThrow(/owner identity/i);
    expect(() =>
      unifiedEnforce({}, 'owner-1', {
        ...context,
        continuity: ['duplicate'],
      }),
    ).toThrow(/continuity identifier/i);
    expect(() =>
      unifiedEnforce({}, 'owner-1', { ...context, policy: { messages: [] } }),
    ).toThrow();
  });

  it('uses the owner identity as the job tenant and accepts propagated context', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: {
        'x-owner-id': 'owner-1',
        'x-continuity-id': 'continuity-1',
      },
      payload: {
        model: 'test-model',
        messages: [{ role: 'user', content: 'hello' }],
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({ tenantId: 'owner-1' });
    await app.close();
  });
});
