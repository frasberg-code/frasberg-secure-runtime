import { applyAdjustment } from '../../supabase/sofia_core/field_adjustment/field_adjustment';

describe('field_adjustment', () => {
  test('applies correction factor', () => {
    expect(applyAdjustment(10, -2)).toBe(8);
  });

  test('applies positive correction', () => {
    expect(applyAdjustment(5, 3)).toBe(8);
  });

  test('handles zero correction', () => {
    expect(applyAdjustment(10, 0)).toBe(10);
  });

  test('handles negative state', () => {
    expect(applyAdjustment(-5, 3)).toBe(-2);
  });

  test('handles decimal values', () => {
    expect(applyAdjustment(10.5, 2.3)).toBeCloseTo(12.8);
  });
});
