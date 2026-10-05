import { projectFieldPresence } from '../../supabase/sofia_core/field_presence_projection/field_projection';

describe('field_presence_projection', () => {
  test('projects presence using projector', () => {
    const projector = (x: string) => `proj:${x}`;
    const result = projectFieldPresence('res', projector);
    expect(result.projected).toBe(true);
    expect(result.signal).toBe('proj:res');
  });

  test('projects numeric presence', () => {
    const projector = (x: number) => x * 5;
    const result = projectFieldPresence(8, projector);
    expect(result.projected).toBe(true);
    expect(result.signal).toBe(40);
  });

  test('projects object presence', () => {
    const projector = (x: { data: string }) => ({ data: `projected_${x.data}` });
    const result = projectFieldPresence({ data: 'SIGNAL' }, projector);
    expect(result.projected).toBe(true);
    expect(result.signal).toEqual({ data: 'projected_SIGNAL' });
  });

  test('projects with identity projector', () => {
    const projector = (x: string) => x;
    const result = projectFieldPresence('RESONANCE', projector);
    expect(result.projected).toBe(true);
    expect(result.signal).toBe('RESONANCE');
  });

  test('projects array presence', () => {
    const projector = (x: string[]) => x.map(s => `${s}_out`);
    const result = projectFieldPresence(['A', 'B'], projector);
    expect(result.projected).toBe(true);
    expect(result.signal).toEqual(['A_out', 'B_out']);
  });
});
