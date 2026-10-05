import { reintegrateFieldState } from '../../supabase/sofia_core/field_reintegration/field_reintegration';

describe('field_reintegration', () => {
  test('reintegrates field using reintegrator', () => {
    const reintegrator = (x: number[]) => x.slice().reverse();
    const result = reintegrateFieldState([1, 2, 3], reintegrator);
    expect(result.reintegrated).toBe(true);
    expect(result.value).toEqual([3, 2, 1]);
  });

  test('reintegrates string field', () => {
    const reintegrator = (x: string) => `global:${x}`;
    const result = reintegrateFieldState('reconf', reintegrator);
    expect(result.reintegrated).toBe(true);
    expect(result.value).toBe('global:reconf');
  });

  test('reintegrates numeric field', () => {
    const reintegrator = (x: number) => x / 2;
    const result = reintegrateFieldState(200, reintegrator);
    expect(result.reintegrated).toBe(true);
    expect(result.value).toBe(100);
  });

  test('reintegrates object field', () => {
    const reintegrator = (x: { coherence: boolean }) => ({ ...x, global: true });
    const result = reintegrateFieldState({ coherence: true }, reintegrator);
    expect(result.reintegrated).toBe(true);
    expect(result.value).toEqual({ coherence: true, global: true });
  });

  test('reintegrates field with identity reintegrator', () => {
    const reintegrator = (x: string) => x;
    const result = reintegrateFieldState('STABLE', reintegrator);
    expect(result.reintegrated).toBe(true);
    expect(result.value).toBe('STABLE');
  });
});
