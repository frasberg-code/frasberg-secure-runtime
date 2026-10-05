import { projectDominion } from '../../supabase/sofia_core/field_dominion_projection/field_dominion_projection';

describe('field_dominion_projection', () => {
  test('projects dominion using projector', () => {
    const projector = (x: string) => `dom:${x}`;
    const result = projectDominion('authority', projector);
    expect(result.projected).toBe(true);
    expect(result.value).toBe('dom:authority');
  });

  test('projects dominion with numeric transformation', () => {
    const projector = (x: number) => x + 100;
    const result = projectDominion(50, projector);
    expect(result.projected).toBe(true);
    expect(result.value).toBe(150);
  });

  test('projects dominion with array transformation', () => {
    const projector = (x: string[]) => x.map(s => `projected:${s}`);
    const result = projectDominion(['auth1', 'auth2'], projector);
    expect(result.projected).toBe(true);
    expect(result.value).toEqual(['projected:auth1', 'projected:auth2']);
  });

  test('projects dominion with object transformation', () => {
    const projector = (x: { authoritative: boolean }) => ({ ...x, projected: true });
    const result = projectDominion({ authoritative: true }, projector);
    expect(result.projected).toBe(true);
    expect(result.value).toEqual({ authoritative: true, projected: true });
  });

  test('projects dominion with identity function', () => {
    const projector = (x: string[]) => x;
    const result = projectDominion(['domain1', 'domain2'], projector);
    expect(result.projected).toBe(true);
    expect(result.value).toEqual(['domain1', 'domain2']);
  });
});
