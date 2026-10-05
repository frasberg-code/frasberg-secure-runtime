import { flowContinuumStateIV } from '../../supabase/sofia_core/field_continuum_flow_iv/field_continuum_flow_iv';

describe('field_continuum_flow_iv', () => {
  test('flows fourth-order continuum numerically', () => {
    const fn = (x: number) => x * 4;
    const result = flowContinuumStateIV(100, fn);
    expect(result.flowing).toBe(true);
    expect(result.value).toBe(400);
  });

  test('flows fourth-order continuum for strings', () => {
    const fn = (x: string) => `${x}::flow4`;
    const result = flowContinuumStateIV('init4', fn);
    expect(result.flowing).toBe(true);
    expect(result.value).toBe('init4::flow4');
  });
});
