import { initiateContinuumStateIV } from '../../supabase/sofia_core/field_continuum_initiation_iv/field_continuum_initiation_iv';

describe('field_continuum_initiation_iv', () => {
  test('initiates fourth-order continuum numerically', () => {
    const fn = (x: number) => x + 4400;
    const result = initiateContinuumStateIV(10, fn);
    expect(result.initiated).toBe(true);
    expect(result.value).toBe(4410);
  });

  test('initiates fourth-order continuum for strings', () => {
    const fn = (x: string) => `${x}::init4`;
    const result = initiateContinuumStateIV('horizon4', fn);
    expect(result.initiated).toBe(true);
    expect(result.value).toBe('horizon4::init4');
  });
});
