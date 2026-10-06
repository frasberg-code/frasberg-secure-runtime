import { describe, expect, test } from 'vitest';
import { buildErrorResponse } from '../src/error-response';

describe('error response fallbacks', () => {
  test.each([undefined, '', null])(
    'always includes a request id for invalid input %s',
    (requestId) => {
      const result = buildErrorResponse(
        requestId as string,
        'TEST_ERROR',
        'Message',
      );
      expect(result.requestId).toMatch(/^req_[a-zA-Z0-9_-]{8,128}$/);
    },
  );

  test.each([undefined, '', '   ', null])(
    'uses INTERNAL_ERROR for invalid code %s',
    (code) => {
      const result = buildErrorResponse('req_123', code as string, 'Message');
      expect(result.error.code).toBe('INTERNAL_ERROR');
    },
  );

  test.each([undefined, '', '   ', null])(
    'uses a safe message for invalid message %s',
    (message) => {
      const result = buildErrorResponse(
        'req_123',
        'TEST_ERROR',
        message as string,
      );
      expect(result.error.message).toBe('Unexpected internal error.');
    },
  );

  test('preserves valid code and message', () => {
    const result = buildErrorResponse(
      'req_123',
      'PERMISSION_DENIED',
      'Permission denied.',
    );
    expect(result.error).toEqual({
      code: 'PERMISSION_DENIED',
      message: 'Permission denied.',
    });
  });
});
