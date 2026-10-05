import { computeVector } from '../../supabase/sofia_core/field_vector/field_vector';

describe('field_vector', () => {
  test('computes vector components', () => {
    const vector = computeVector(10, Math.PI / 2);
    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(10);
  });

  test('computes vector at 0 radians', () => {
    const vector = computeVector(5, 0);
    expect(vector.x).toBeCloseTo(5);
    expect(vector.y).toBeCloseTo(0);
  });

  test('computes vector at PI radians', () => {
    const vector = computeVector(3, Math.PI);
    expect(vector.x).toBeCloseTo(-3);
    expect(vector.y).toBeCloseTo(0);
  });

  test('computes vector at 3PI/2 radians', () => {
    const vector = computeVector(4, (3 * Math.PI) / 2);
    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(-4);
  });

  test('handles zero magnitude', () => {
    const vector = computeVector(0, Math.PI / 4);
    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(0);
  });

  test('handles negative magnitude', () => {
    const vector = computeVector(-10, Math.PI / 2);
    expect(vector.x).toBeCloseTo(0);
    expect(vector.y).toBeCloseTo(-10);
  });

  test('computes vector at 45 degrees', () => {
    const vector = computeVector(10, Math.PI / 4);
    expect(vector.x).toBeCloseTo(7.071, 2);
    expect(vector.y).toBeCloseTo(7.071, 2);
  });
});
