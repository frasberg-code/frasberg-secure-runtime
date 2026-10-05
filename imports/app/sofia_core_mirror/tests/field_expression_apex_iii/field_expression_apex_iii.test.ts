import { expressApexStateIII } from '../../supabase/sofia_core/field_expression_apex_iii/field_expression_apex_iii';

describe('field_expression_apex_iii', () => {
  test('expresses third-order apex using expressFn', () => {
    const expressFn = (x: number[]) => x.map(v => v * 3);
    const result = expressApexStateIII([1, 2, 3], expressFn);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual([3, 6, 9]);
  });

  test('expresses third-order numeric apex', () => {
    const expressFn = (x: number) => x * 3;
    const result = expressApexStateIII(10, expressFn);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe(30);
  });

  test('expresses third-order string apex', () => {
    const expressFn = (x: string) => `expressed3:${x}`;
    const result = expressApexStateIII('focused3', expressFn);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('expressed3:focused3');
  });

  test('expresses third-order array apex', () => {
    const expressFn = (x: string[]) => x.map(s => s.toUpperCase());
    const result = expressApexStateIII(['a', 'b', 'c'], expressFn);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual(['A', 'B', 'C']);
  });

  test('expresses third-order object apex', () => {
    const expressFn = (x: { signal: number }) => ({ signal: x.signal * 100 });
    const result = expressApexStateIII({ signal: 5 }, expressFn);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual({ signal: 500 });
  });

  test('expresses third-order apex with identity expressFn', () => {
    const expressFn = (x: string) => x;
    const result = expressApexStateIII('APEX_III', expressFn);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('APEX_III');
  });
});
