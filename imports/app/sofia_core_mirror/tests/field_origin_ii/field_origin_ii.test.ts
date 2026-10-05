import { returnToOriginII } from '../../supabase/sofia_core/field_origin_ii/field_origin_ii';

describe('field_origin_ii', () => {
  test('returns to origin-II using originator', () => {
    const originator = (x: number) => x - 10;
    const result = returnToOriginII(50, originator);
    expect(result.origin).toBe(true);
    expect(result.value).toBe(40);
  });

  test('returns string horizon-II to origin-II', () => {
    const originator = (x: string) => `origin2:${x}`;
    const result = returnToOriginII('horizon2', originator);
    expect(result.origin).toBe(true);
    expect(result.value).toBe('origin2:horizon2');
  });
});
