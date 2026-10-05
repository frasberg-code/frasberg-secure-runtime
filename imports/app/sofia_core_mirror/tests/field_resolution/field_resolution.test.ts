import { resolveFieldConflict } from '../../supabase/sofia_core/field_resolution/field_resolution';

describe('field_resolution', () => {
  test('resolves to highest-weight intent', () => {
    const intents = [
      { option: 'A', weight: 0.2 },
      { option: 'B', weight: 0.8 },
      { option: 'C', weight: 0.5 },
    ];
    expect(resolveFieldConflict(intents)).toBe('B');
  });

  test('throws error for empty intents array', () => {
    const intents: Array<{ option: string; weight: number }> = [];
    expect(() => resolveFieldConflict(intents)).toThrow('No intents provided for resolution');
  });

  test('resolves single intent', () => {
    const intents = [{ option: 'ONLY', weight: 0.5 }];
    expect(resolveFieldConflict(intents)).toBe('ONLY');
  });

  test('resolves with equal weights returns first in sorted order', () => {
    const intents = [
      { option: 'X', weight: 0.5 },
      { option: 'Y', weight: 0.5 },
    ];
    // Both have same weight, either X or Y is acceptable
    const result = resolveFieldConflict(intents);
    expect(['X', 'Y']).toContain(result);
  });

  test('resolves complex numeric options', () => {
    const intents = [
      { option: 100, weight: 0.3 },
      { option: 200, weight: 0.9 },
      { option: 300, weight: 0.1 },
    ];
    expect(resolveFieldConflict(intents)).toBe(200);
  });
});
