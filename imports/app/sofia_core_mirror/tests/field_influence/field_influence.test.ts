import { applyFieldInfluence } from '../../supabase/sofia_core/field_influence/field_influence';

describe('field_influence', () => {
  test('applies influence using influencer', () => {
    const influencer = (x: number) => x + 10;
    const result = applyFieldInfluence(5, influencer);
    expect(result.influencing).toBe(true);
    expect(result.value).toBe(15);
  });

  test('applies string influence', () => {
    const influencer = (x: string) => `influenced:${x}`;
    const result = applyFieldInfluence('presence', influencer);
    expect(result.influencing).toBe(true);
    expect(result.value).toBe('influenced:presence');
  });

  test('applies object influence', () => {
    const influencer = (x: { power: number }) => ({ power: x.power * 2 });
    const result = applyFieldInfluence({ power: 5 }, influencer);
    expect(result.influencing).toBe(true);
    expect(result.value).toEqual({ power: 10 });
  });

  test('applies influence with identity influencer', () => {
    const influencer = (x: number) => x;
    const result = applyFieldInfluence(42, influencer);
    expect(result.influencing).toBe(true);
    expect(result.value).toBe(42);
  });

  test('applies array influence', () => {
    const influencer = (x: string[]) => x.map(s => `inf:${s}`);
    const result = applyFieldInfluence(['A', 'B'], influencer);
    expect(result.influencing).toBe(true);
    expect(result.value).toEqual(['inf:A', 'inf:B']);
  });
});
