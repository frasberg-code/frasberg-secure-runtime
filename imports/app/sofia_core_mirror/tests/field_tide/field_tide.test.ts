import { applyTide } from '../../supabase/sofia_core/field_tide/field_tide';

describe('field_tide', () => {
  test('applies rising tide', () => {
    expect(applyTide(10, 'rise')).toBe(11);
  });

  test('applies falling tide', () => {
    expect(applyTide(10, 'fall')).toBe(9);
  });

  test('handles zero value with rise', () => {
    expect(applyTide(0, 'rise')).toBe(1);
  });

  test('handles zero value with fall', () => {
    expect(applyTide(0, 'fall')).toBe(-1);
  });

  test('handles negative values with rise', () => {
    expect(applyTide(-5, 'rise')).toBe(-4);
  });

  test('handles negative values with fall', () => {
    expect(applyTide(-5, 'fall')).toBe(-6);
  });

  test('handles large values', () => {
    expect(applyTide(1000, 'rise')).toBe(1001);
    expect(applyTide(1000, 'fall')).toBe(999);
  });
});
