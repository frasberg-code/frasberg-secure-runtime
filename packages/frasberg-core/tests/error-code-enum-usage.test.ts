import { describe, test, expect } from 'vitest';
import { ErrorCode } from '../src/error-codes';

describe('ErrorCode enum', () => {
  test('contains required authentication codes', () => {
    expect(ErrorCode.KEY_NOT_FOUND).toBe('KEY_NOT_FOUND');
    expect(ErrorCode.KEY_NOT_PROVIDED).toBe('KEY_NOT_PROVIDED');
  });

  test('contains required permission codes', () => {
    expect(ErrorCode.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    expect(ErrorCode.ACCOUNT_SUSPENDED).toBe('ACCOUNT_SUSPENDED');
  });

  test('contains default internal code', () => {
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });
});
