import { expressApexState } from '../../supabase/sofia_core/field_expression_apex/field_expression_apex';

describe('field_expression_apex', () => {
  test('expresses apex using expresser', () => {
    const expresser = (x: number[]) => x.map(v => v * 2);
    const result = expressApexState([1, 2, 3], expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual([2, 4, 6]);
  });

  test('expresses numeric apex', () => {
    const expresser = (x: number) => x * 3;
    const result = expressApexState(10, expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe(30);
  });

  test('expresses string apex', () => {
    const expresser = (x: string) => `expressed:${x}`;
    const result = expressApexState('focused', expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('expressed:focused');
  });

  test('expresses array apex', () => {
    const expresser = (x: string[]) => x.map(s => s.toUpperCase());
    const result = expressApexState(['a', 'b', 'c'], expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual(['A', 'B', 'C']);
  });

  test('expresses object apex', () => {
    const expresser = (x: { signal: number }) => ({ signal: x.signal * 100 });
    const result = expressApexState({ signal: 5 }, expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toEqual({ signal: 500 });
  });

  test('expresses apex with identity expresser', () => {
    const expresser = (x: string) => x;
    const result = expressApexState('APEX', expresser);
    expect(result.expressed).toBe(true);
    expect(result.value).toBe('APEX');
  });
});
