import { fieldContinuity } from '../supabase/sofia_core/sofia_core_runtime';

describe('fieldContinuity runtime integration', () => {
  test('exports maintainFieldContinuity', () => {
    expect(typeof fieldContinuity.maintainFieldContinuity).toBe('function');
  });

  test('exports computeFieldTrajectory', () => {
    expect(typeof fieldContinuity.computeFieldTrajectory).toBe('function');
  });

  test('exports ensureFieldPersistence', () => {
    expect(typeof fieldContinuity.ensureFieldPersistence).toBe('function');
  });

  test('maintainFieldContinuity works through runtime', () => {
    const result = fieldContinuity.maintainFieldContinuity(1, 2);
    expect(result.previous).toBe(1);
    expect(result.current).toBe(2);
  });

  test('computeFieldTrajectory works through runtime', () => {
    const result = fieldContinuity.computeFieldTrajectory('A', 'B');
    expect(result.origin).toBe('A');
    expect(result.direction).toBe('B');
  });

  test('ensureFieldPersistence works through runtime', () => {
    const result = fieldContinuity.ensureFieldPersistence(5, (x: number) => x > 0);
    expect(result.persistent).toBe(true);
    expect(result.value).toBe(5);
  });
});
