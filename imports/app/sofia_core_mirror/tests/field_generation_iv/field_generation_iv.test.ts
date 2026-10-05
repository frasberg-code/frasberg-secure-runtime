import { generateFieldStateIV } from '../../supabase/sofia_core/field_generation_iv/field_generation_iv';

describe('field_generation_iv', () => {
  test('generates fourth-order state numerically', () => {
    const fn = (x: number) => x * 4;
    const result = generateFieldStateIV(100, fn);
    expect(result.generated).toBe(true);
    expect(result.value).toBe(400);
  });

  test('generates fourth-order state for strings', () => {
    const fn = (x: string) => `${x}::gen4`;
    const result = generateFieldStateIV('origin4', fn);
    expect(result.generated).toBe(true);
    expect(result.value).toBe('origin4::gen4');
  });
});
