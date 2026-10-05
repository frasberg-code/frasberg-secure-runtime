import { reconfigureFieldState } from '../../supabase/sofia_core/field_reconfiguration/field_reconfiguration';

describe('field_reconfiguration', () => {
  test('reconfigures field using reconfigurer', () => {
    const reconfigurer = (x: string) => `reconf:${x}`;
    const result = reconfigureFieldState('T', reconfigurer);
    expect(result.reconfigured).toBe(true);
    expect(result.value).toBe('reconf:T');
  });

  test('reconfigures numeric field', () => {
    const reconfigurer = (x: number) => x - 10;
    const result = reconfigureFieldState(100, reconfigurer);
    expect(result.reconfigured).toBe(true);
    expect(result.value).toBe(90);
  });

  test('reconfigures object field', () => {
    const reconfigurer = (x: { pattern: string }) => ({ pattern: `new_${x.pattern}` });
    const result = reconfigureFieldState({ pattern: 'structure' }, reconfigurer);
    expect(result.reconfigured).toBe(true);
    expect(result.value).toEqual({ pattern: 'new_structure' });
  });

  test('reconfigures field with identity reconfigurer', () => {
    const reconfigurer = (x: string) => x;
    const result = reconfigureFieldState('UNCHANGED', reconfigurer);
    expect(result.reconfigured).toBe(true);
    expect(result.value).toBe('UNCHANGED');
  });

  test('reconfigures array field', () => {
    const reconfigurer = (x: string[]) => x.sort();
    const result = reconfigureFieldState(['c', 'a', 'b'], reconfigurer);
    expect(result.reconfigured).toBe(true);
    expect(result.value).toEqual(['a', 'b', 'c']);
  });
});
