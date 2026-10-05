import { evolveFieldState } from '../../supabase/sofia_core/field_evolution/field_evolution';

describe('field_evolution', () => {
  test('evolves field using evolver', () => {
    const evolver = (x: string) => `evo:${x}`;
    const result = evolveFieldState('A', evolver);
    expect(result.evolved).toBe(true);
    expect(result.value).toBe('evo:A');
  });

  test('evolves numeric field', () => {
    const evolver = (x: number) => x * 10;
    const result = evolveFieldState(5, evolver);
    expect(result.evolved).toBe(true);
    expect(result.value).toBe(50);
  });

  test('evolves array field', () => {
    const evolver = (x: number[]) => x.map(n => n * 2);
    const result = evolveFieldState([1, 2, 3], evolver);
    expect(result.evolved).toBe(true);
    expect(result.value).toEqual([2, 4, 6]);
  });

  test('evolves object field', () => {
    const evolver = (x: { level: number }) => ({ level: x.level + 1 });
    const result = evolveFieldState({ level: 1 }, evolver);
    expect(result.evolved).toBe(true);
    expect(result.value).toEqual({ level: 2 });
  });

  test('evolves field with identity evolver', () => {
    const evolver = (x: string) => x;
    const result = evolveFieldState('STABLE', evolver);
    expect(result.evolved).toBe(true);
    expect(result.value).toBe('STABLE');
  });
});
