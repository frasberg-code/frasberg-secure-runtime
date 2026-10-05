import { adaptFieldState } from '../../supabase/sofia_core/field_adaptation/field_adaptation';

describe('field_adaptation', () => {
  test('adapts field using adapter', () => {
    const adapter = (x: number) => x + 1;
    const result = adaptFieldState(10, adapter);
    expect(result.adapted).toBe(true);
    expect(result.value).toBe(11);
  });

  test('adapts string field', () => {
    const adapter = (x: string) => `adapted:${x}`;
    const result = adaptFieldState('reintegrated', adapter);
    expect(result.adapted).toBe(true);
    expect(result.value).toBe('adapted:reintegrated');
  });

  test('adapts numeric field', () => {
    const adapter = (x: number) => x * 2;
    const result = adaptFieldState(50, adapter);
    expect(result.adapted).toBe(true);
    expect(result.value).toBe(100);
  });

  test('adapts object field', () => {
    const adapter = (x: { global: boolean }) => ({ ...x, adaptive: true });
    const result = adaptFieldState({ global: true }, adapter);
    expect(result.adapted).toBe(true);
    expect(result.value).toEqual({ global: true, adaptive: true });
  });

  test('adapts field with identity adapter', () => {
    const adapter = (x: number) => x;
    const result = adaptFieldState(42, adapter);
    expect(result.adapted).toBe(true);
    expect(result.value).toBe(42);
  });
});
