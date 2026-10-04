import { describe, expect, it } from 'vitest';
import { authenticateRequest, type ApiKeyRecord } from '../src/auth';

const apiKeys: ApiKeyRecord[] = [
  {
    id: 'tenant-key',
    secret: 'tenant-secret',
    permissions: ['chat'],
    tenants: ['tenant-a', 'tenant-b'],
  },
  {
    id: 'unscoped-key',
    secret: 'unscoped-secret',
    permissions: ['chat'],
  },
];

describe('API key tenant binding', () => {
  it('uses a tenant explicitly assigned to the key', () => {
    const result = authenticateRequest(
      {
        'x-api-key': 'tenant-secret',
        'x-tenant-id': 'tenant-b',
      },
      apiKeys,
    );

    expect(result.context?.tenantId).toBe('tenant-b');
    expect(result.error).toBeUndefined();
  });

  it('defaults to the first configured tenant when no tenant is requested', () => {
    const result = authenticateRequest(
      { 'x-api-key': 'tenant-secret' },
      apiKeys,
    );

    expect(result.context?.tenantId).toBe('tenant-a');
  });

  it('rejects a tenant not assigned to the presented key', () => {
    const result = authenticateRequest(
      {
        'x-api-key': 'tenant-secret',
        'x-tenant-id': 'tenant-c',
      },
      apiKeys,
    );

    expect(result.context).toBeUndefined();
    expect(result.error).toEqual({
      error: {
        code: 'FK-001',
        message: 'Invalid or missing API key.',
      },
    });
  });

  it('rejects tenant selection for a key without an assigned tenant', () => {
    const result = authenticateRequest(
      {
        'x-api-key': 'unscoped-secret',
        'x-tenant-id': 'tenant-a',
      },
      apiKeys,
    );

    expect(result.context).toBeUndefined();
    expect(result.error?.error.code).toBe('FK-001');
  });

  it('rejects duplicate tenant headers instead of selecting one', () => {
    const result = authenticateRequest(
      {
        'x-api-key': 'tenant-secret',
        'x-tenant-id': ['tenant-a', 'tenant-b'],
      },
      apiKeys,
    );

    expect(result.context).toBeUndefined();
    expect(result.error?.error.code).toBe('FK-001');
  });
});
