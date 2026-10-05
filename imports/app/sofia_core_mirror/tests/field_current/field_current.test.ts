import { stabilizeCurrent } from '../../supabase/sofia_core/field_current/field_current';

describe('field_current', () => {
  test('stabilizes current with anchor', () => {
    const result = stabilizeCurrent('state', 'anchor');
    expect(result).toEqual({ current: 'state', anchor: 'anchor' });
  });

  test('handles numeric input', () => {
    const result = stabilizeCurrent(42, 100);
    expect(result).toEqual({ current: 42, anchor: 100 });
  });

  test('handles object input', () => {
    const input = { value: 'test' };
    const anchor = { ref: 'reference' };
    const result = stabilizeCurrent(input, anchor);
    expect(result).toEqual({ current: input, anchor: anchor });
  });

  test('handles null values', () => {
    const result = stabilizeCurrent(null, null);
    expect(result).toEqual({ current: null, anchor: null });
  });

  test('handles undefined values', () => {
    const result = stabilizeCurrent(undefined, undefined);
    expect(result).toEqual({ current: undefined, anchor: undefined });
  });
});
