import { describe, test, expect } from 'vitest';
import { redactObject } from '../src/redact';

describe('nested secret redaction', () => {
  test('redacts nested secrets', () => {
    const input = {
      user: {
        token: 'abc123',
        profile: {
          password: 'secret-password',
          api: { access_token: 'token123' },
        },
      },
    };
    expect(redactObject(input)).toEqual({
      user: {
        token: '[REDACTED]',
        profile: {
          password: '[REDACTED]',
          api: { access_token: '[REDACTED]' },
        },
      },
    });
  });

  test('redacts arrays of secrets', () => {
    const input = { keys: [{ secret: 'one' }, { secret: 'two' }] };
    expect(redactObject(input)).toEqual({
      keys: [{ secret: '[REDACTED]' }, { secret: '[REDACTED]' }],
    });
  });
});
