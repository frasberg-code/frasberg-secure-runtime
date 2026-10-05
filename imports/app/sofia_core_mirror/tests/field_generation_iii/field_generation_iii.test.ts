import { generateFieldStateIII } from '../../supabase/sofia_core/field_generation_iii/field_generation_iii';

describe('field_generation_iii', () => {
  test('generates third-order field state', () => {
    const generator = (x: number) => x * 10;
    const result = generateFieldStateIII(7, generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe(70);
  });

  test('generates string third-order field state', () => {
    const generator = (x: string) => `${x}::gen3`;
    const result = generateFieldStateIII('seed', generator);
    expect(result.generated).toBe(true);
    expect(result.value).toBe('seed::gen3');
  });
});
