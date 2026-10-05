import { computeFieldTrajectory } from '../../supabase/sofia_core/field_trajectory/field_trajectory';

describe('field_trajectory', () => {
  test('computes trajectory from origin and direction', () => {
    const result = computeFieldTrajectory('start', 'north');
    expect(result.origin).toBe('start');
    expect(result.direction).toBe('north');
  });

  test('handles numeric trajectory', () => {
    const result = computeFieldTrajectory(0, 10);
    expect(result.origin).toBe(0);
    expect(result.direction).toBe(10);
  });

  test('handles object trajectory', () => {
    const origin = { x: 0, y: 0 };
    const direction = { x: 1, y: 1 };
    const result = computeFieldTrajectory(origin, direction);
    expect(result.origin).toEqual({ x: 0, y: 0 });
    expect(result.direction).toEqual({ x: 1, y: 1 });
  });

  test('handles array trajectory', () => {
    const result = computeFieldTrajectory([0, 0, 0], [1, 2, 3]);
    expect(result.origin).toEqual([0, 0, 0]);
    expect(result.direction).toEqual([1, 2, 3]);
  });

  test('handles boolean trajectory', () => {
    const result = computeFieldTrajectory(false, true);
    expect(result.origin).toBe(false);
    expect(result.direction).toBe(true);
  });

  test('handles same origin and direction', () => {
    const result = computeFieldTrajectory('point', 'point');
    expect(result.origin).toBe('point');
    expect(result.direction).toBe('point');
  });
});
