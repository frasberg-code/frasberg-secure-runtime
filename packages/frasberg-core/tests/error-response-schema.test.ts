import { describe, test, expect } from 'vitest';
import { buildErrorResponse } from '../src/error-response';

describe('error schema', () => {
  test('matches schema', () => {
    expect(buildErrorResponse('req_123', 'PERMISSION_DENIED', 'Permission denied.')).toEqual({
      success: false,
      requestId: 'req_123',
      error: { code: 'PERMISSION_DENIED', message: 'Permission denied.' },
    });
  });

  test.each(['success', 'requestId'])('always includes %s', (k) => {
    const e: any = buildErrorResponse('req_123', 'TEST_ERROR', 'Test message');
    expect(e[k]).toBeDefined();
    expect(e.success).toBe(false);
    expect(e.error.code).toBeDefined();
    expect(e.error.message).toBeDefined();
  });
});
