import { ascendFieldState } from '../../supabase/sofia_core/field_ascent/field_ascent';

describe('field_ascent', () => {
  test('ascends field using ascender', () => {
    const ascender = (x: number[]) => [...x, x.length * 10];
    const result = ascendFieldState([1, 2], ascender);
    expect(result.ascending).toBe(true);
    expect(result.value).toEqual([1, 2, 20]);
  });

  test('ascends numeric field', () => {
    const ascender = (x: number) => x * 1.5;
    const result = ascendFieldState(10, ascender);
    expect(result.ascending).toBe(true);
    expect(result.value).toBe(15);
  });

  test('ascends string field', () => {
    const ascender = (x: string) => `asc:${x}`;
    const result = ascendFieldState('refined', ascender);
    expect(result.ascending).toBe(true);
    expect(result.value).toBe('asc:refined');
  });

  test('ascends object field', () => {
    const ascender = (x: { level: number }) => ({ level: x.level + 10 });
    const result = ascendFieldState({ level: 5 }, ascender);
    expect(result.ascending).toBe(true);
    expect(result.value).toEqual({ level: 15 });
  });

  test('ascends field with identity ascender', () => {
    const ascender = (x: string) => x;
    const result = ascendFieldState('STABLE', ascender);
    expect(result.ascending).toBe(true);
    expect(result.value).toBe('STABLE');
  });
});
