import { stabilizeContinuumStateIV } from '../../supabase/sofia_core/field_continuum_stabilization_iv/field_continuum_stabilization_iv';

describe('field_continuum_stabilization_iv', () => {
  test('stabilizes fourth-order continuum numerically', () => {
    const fn = (x: number) => x + 44;
    const result = stabilizeContinuumStateIV(400, fn);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe(444);
  });

  test('stabilizes fourth-order continuum for strings', () => {
    const fn = (x: string) => `${x}::stab4`;
    const result = stabilizeContinuumStateIV('flow4', fn);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe('flow4::stab4');
  });
});
