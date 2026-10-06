import { describe, test, expect } from 'vitest';
import { redactObject } from '../src/redact';

describe('redactObject', () => {
  test('redacts sensitive keys recursively and keeps the rest', () => {
    const out: any = redactObject({
      user: 'a',
      authorization: 'Bearer secret',
      nested: { apiKey: 'luc_live_x', password: 'p', ok: 1 },
    });
    expect(JSON.stringify(out)).not.toMatch(/secret|luc_live_x|"p"/);
    expect(out.user).toBe('a');
    expect(out.nested.ok).toBe(1);
  });
});
