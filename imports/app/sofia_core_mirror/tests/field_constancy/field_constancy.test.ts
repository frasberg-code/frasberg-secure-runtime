import { maintainFieldConstancy } from '../../supabase/sofia_core/field_constancy/field_constancy';

describe('field_constancy', () => {
  test('maintains identity constancy using comparator', () => {
    const comparator = (prev: string | null, curr: string) => prev === curr;
    const result = maintainFieldConstancy('A', 'A', comparator);
    expect(result.constant).toBe(true);
    expect(result.identity).toBe('A');
  });

  test('detects identity change when values differ', () => {
    const comparator = (prev: string | null, curr: string) => prev === curr;
    const result = maintainFieldConstancy('A', 'B', comparator);
    expect(result.constant).toBe(false);
    expect(result.identity).toBe('B');
  });

  test('handles first cycle with null previous', () => {
    const comparator = (prev: string | null, curr: string) => prev === null || prev === curr;
    const result = maintainFieldConstancy(null, 'initial', comparator);
    expect(result.constant).toBe(true);
    expect(result.identity).toBe('initial');
  });

  test('handles number identity constancy', () => {
    const comparator = (prev: number | null, curr: number) => prev === curr;
    const result = maintainFieldConstancy(42, 42, comparator);
    expect(result.constant).toBe(true);
    expect(result.identity).toBe(42);
  });

  test('handles object identity constancy with deep comparison', () => {
    const comparator = (prev: { id: number } | null, curr: { id: number }) =>
      prev !== null && prev.id === curr.id;
    const result = maintainFieldConstancy({ id: 1 }, { id: 1 }, comparator);
    expect(result.constant).toBe(true);
    expect(result.identity).toEqual({ id: 1 });
  });

  test('detects object identity change', () => {
    const comparator = (prev: { id: number } | null, curr: { id: number }) =>
      prev !== null && prev.id === curr.id;
    const result = maintainFieldConstancy({ id: 1 }, { id: 2 }, comparator);
    expect(result.constant).toBe(false);
    expect(result.identity).toEqual({ id: 2 });
  });

  test('handles array identity constancy', () => {
    const comparator = (prev: number[] | null, curr: number[]) =>
      prev !== null && JSON.stringify(prev) === JSON.stringify(curr);
    const result = maintainFieldConstancy([1, 2, 3], [1, 2, 3], comparator);
    expect(result.constant).toBe(true);
    expect(result.identity).toEqual([1, 2, 3]);
  });

  test('preserves current identity even when not constant', () => {
    const comparator = (prev: string | null, curr: string) => prev === curr;
    const result = maintainFieldConstancy('old', 'new', comparator);
    expect(result.constant).toBe(false);
    expect(result.identity).toBe('new');
  });
});
