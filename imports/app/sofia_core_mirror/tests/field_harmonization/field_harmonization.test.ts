import { harmonizeFieldState } from '../../supabase/sofia_core/field_harmonization/field_harmonization';

describe('field_harmonization', () => {
  test('harmonizes states using harmonizer', () => {
    const harmonizer = (arr: string[]) => arr.join('-');
    expect(harmonizeFieldState(['A', 'B', 'C'], harmonizer)).toBe('A-B-C');
  });

  test('handles single state', () => {
    const harmonizer = (arr: string[]) => arr[0];
    expect(harmonizeFieldState(['state'], harmonizer)).toBe('state');
  });

  test('handles numeric states', () => {
    const harmonizer = (arr: number[]) => arr.reduce((a, b) => a * b, 1);
    expect(harmonizeFieldState([2, 3, 4], harmonizer)).toBe(24);
  });

  test('handles object states', () => {
    const harmonizer = (arr: { key: string }[]) => ({
      key: arr.map((s) => s.key).join(','),
    });
    const result = harmonizeFieldState(
      [{ key: 'X' }, { key: 'Y' }, { key: 'Z' }],
      harmonizer
    );
    expect(result).toEqual({ key: 'X,Y,Z' });
  });

  test('throws error when no states provided', () => {
    const harmonizer = (arr: string[]) => arr[0];
    expect(() => harmonizeFieldState([], harmonizer)).toThrow(
      'No states provided for harmonization'
    );
  });

  test('handles custom harmonizer logic', () => {
    const harmonizer = (arr: number[]) =>
      arr.reduce((sum, val) => sum + val, 0) / arr.length;
    expect(harmonizeFieldState([10, 20, 30], harmonizer)).toBe(20);
  });
});
