import { expressApexIIState } from '../../supabase/sofia_core/field_expression_apex_ii/field_expression_apex_ii';

describe('field_expression_apex_ii', () => {
  test('expresses second-order apex using expresser', () => {
    const expresser = (x: number[]) => x.map(v => v + 100);
    const result = expressApexIIState([1, 2], expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual([101, 102]);
  });

  test('expresses numeric second-order apex', () => {
    const expresser = (x: number) => x * 4;
    const result = expressApexIIState(10, expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe(40);
  });

  test('expresses string second-order apex', () => {
    const expresser = (x: string) => `expressed-ii:${x}`;
    const result = expressApexIIState('focused-ii', expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('expressed-ii:focused-ii');
  });

  test('expresses array second-order apex', () => {
    const expresser = (x: string[]) => x.map(s => s.toUpperCase());
    const result = expressApexIIState(['a', 'b', 'c'], expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual(['A', 'B', 'C']);
  });

  test('expresses object second-order apex', () => {
    const expresser = (x: { signal: number }) => ({ signal: x.signal * 200 });
    const result = expressApexIIState({ signal: 5 }, expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual({ signal: 1000 });
  });

  test('expresses second-order apex with identity expresser', () => {
    const expresser = (x: string) => x;
    const result = expressApexIIState('APEX-II', expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('APEX-II');
  });
});
