import { projectDominionIII } from '../../supabase/sofia_core/field_dominion_projection_iii/field_dominion_projection_iii';

describe('field_dominion_projection_iii', () => {
  test('projects third-order dominion numerically', () => {
    const projector = (x: number) => x * 3;
    const result = projectDominionIII(100, projector);
    expect(result.projected).toBe(true);
    expect(result.value).toBe(300);
  });

  test('projects third-order dominion for strings', () => {
    const projector = (x: string) => `${x}::proj3`;
    const result = projectDominionIII('dom', projector);
    expect(result.projected).toBe(true);
    expect(result.value).toBe('dom::proj3');
  });
});
