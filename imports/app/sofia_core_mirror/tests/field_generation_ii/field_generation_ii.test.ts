import { generateFieldStateII } from '../../supabase/sofia_core/field_generation_ii/field_generation_ii';

describe('field_generation_ii', () => {
  test('generates field-II using generator', () => {
    const generator = (x: number) => x * 3;
    const result = generateFieldStateII(4, generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe(12);
  });

  test('generates string field-II', () => {
    const generator = (x: string) => `${x}::gen2`;
    const result = generateFieldStateII('origin2', generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe('origin2::gen2');
  });
});
