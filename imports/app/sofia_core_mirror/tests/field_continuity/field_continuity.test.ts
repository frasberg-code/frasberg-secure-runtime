import { maintainFieldContinuity } from '../../supabase/sofia_core/field_continuity/field_continuity';

describe('field_continuity', () => {
  test('maintains continuity between previous and current', () => {
    const result = maintainFieldContinuity(1, 2);
    expect(result.previous).toBe(1);
    expect(result.current).toBe(2);
  });

  test('handles null previous state for first cycle', () => {
    const result = maintainFieldContinuity(null, 'start');
    expect(result.previous).toBeNull();
    expect(result.current).toBe('start');
  });

  test('handles object states', () => {
    const prev = { value: 10 };
    const curr = { value: 20 };
    const result = maintainFieldContinuity(prev, curr);
    expect(result.previous).toEqual({ value: 10 });
    expect(result.current).toEqual({ value: 20 });
  });

  test('handles array states', () => {
    const result = maintainFieldContinuity([1, 2], [3, 4]);
    expect(result.previous).toEqual([1, 2]);
    expect(result.current).toEqual([3, 4]);
  });

  test('handles string states', () => {
    const result = maintainFieldContinuity('previous', 'current');
    expect(result.previous).toBe('previous');
    expect(result.current).toBe('current');
  });

  test('handles boolean states', () => {
    const result = maintainFieldContinuity(false, true);
    expect(result.previous).toBe(false);
    expect(result.current).toBe(true);
  });
});
