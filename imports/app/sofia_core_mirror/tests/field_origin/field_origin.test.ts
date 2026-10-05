import { returnToOrigin } from '../../supabase/sofia_core/field_origin/field_origin';

describe('field_origin', () => {
  test('returns field to origin using originator', () => {
    const originator = (x: number) => x - 100;
    const result = returnToOrigin(150, originator);
    expect(result.origin).toBe(true);
    expect(result.value).toBe(50);
  });

  test('returns string field to origin', () => {
    const originator = (x: string) => x.replace('horizon:', '');
    const result = returnToOrigin('horizon:seed', originator);
    expect(result.origin).toBe(true);
    expect(result.value).toBe('seed');
  });

  test('returns array field to origin', () => {
    const originator = (x: number[]) => x.slice(0, 1);
    const result = returnToOrigin([1, 2, 3, 4], originator);
    expect(result.origin).toBe(true);
    expect(result.value).toEqual([1]);
  });

  test('returns object field to origin', () => {
    const originator = (x: { base: number; extra: number }) => ({ base: x.base, extra: 0 });
    const result = returnToOrigin({ base: 10, extra: 5 }, originator);
    expect(result.origin).toBe(true);
    expect(result.value).toEqual({ base: 10, extra: 0 });
  });

  test('returns field with identity originator', () => {
    const originator = (x: string) => x;
    const result = returnToOrigin('origin', originator);
    expect(result.origin).toBe(true);
    expect(result.value).toBe('origin');
  });
});
