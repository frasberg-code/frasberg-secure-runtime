import { describe, expect, test } from 'vitest';
import { generateRequestId } from '../src/request-id';

describe('request id uniqueness', () => {
  test('generates unique ids across 10,000 requests', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10_000; i += 1) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(10_000);
  });
});
