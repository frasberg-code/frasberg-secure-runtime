import { projectFieldAction } from '../../supabase/sofia_core/field_projection/field_projection';

describe('field_projection', () => {
  test('projects action using projector', () => {
    const projector = (x: string) => `projected:${x}`;
    const result = projectFieldAction('MOVE', projector);
    expect(result.projected).toBe(true);
    expect(result.payload).toBe('projected:MOVE');
  });

  test('projects numeric action', () => {
    const projector = (x: number) => x * 10;
    const result = projectFieldAction(5, projector);
    expect(result.projected).toBe(true);
    expect(result.payload).toBe(50);
  });

  test('projects object action', () => {
    const projector = (x: { action: string }) => ({ action: `proj_${x.action}` });
    const result = projectFieldAction({ action: 'STOP' }, projector);
    expect(result.projected).toBe(true);
    expect(result.payload).toEqual({ action: 'proj_STOP' });
  });

  test('projects with identity projector', () => {
    const projector = (x: string) => x;
    const result = projectFieldAction('TEST', projector);
    expect(result.projected).toBe(true);
    expect(result.payload).toBe('TEST');
  });

  test('projects array action', () => {
    const projector = (x: number[]) => x.map(n => n * 2);
    const result = projectFieldAction([1, 2, 3], projector);
    expect(result.projected).toBe(true);
    expect(result.payload).toEqual([2, 4, 6]);
  });
});
