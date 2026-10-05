import { applyFlow } from '../../supabase/sofia_core/field_flow/field_flow';

describe('field_flow', () => {
  test('applies forward flow', () => {
    expect(applyFlow(10, 'forward')).toBe(11);
  });

  test('applies backward flow', () => {
    expect(applyFlow(10, 'backward')).toBe(9);
  });

  test('applies lateral flow', () => {
    expect(applyFlow(10, 'lateral')).toBe(10);
  });

  test('handles zero value with forward', () => {
    expect(applyFlow(0, 'forward')).toBe(1);
  });

  test('handles zero value with backward', () => {
    expect(applyFlow(0, 'backward')).toBe(-1);
  });

  test('handles negative values with forward', () => {
    expect(applyFlow(-5, 'forward')).toBe(-4);
  });

  test('handles negative values with backward', () => {
    expect(applyFlow(-5, 'backward')).toBe(-6);
  });

  test('handles large values', () => {
    expect(applyFlow(1000, 'forward')).toBe(1001);
    expect(applyFlow(1000, 'backward')).toBe(999);
  });
});
