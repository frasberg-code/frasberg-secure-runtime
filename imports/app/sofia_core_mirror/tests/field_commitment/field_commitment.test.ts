import { commitFieldDecision } from '../../supabase/sofia_core/field_commitment/field_commitment';

describe('field_commitment', () => {
  test('commits decision with decided=true', () => {
    const result = commitFieldDecision('GO');
    expect(result.decided).toBe(true);
    expect(result.value).toBe('GO');
  });

  test('commits numeric decision', () => {
    const result = commitFieldDecision(42);
    expect(result.decided).toBe(true);
    expect(result.value).toBe(42);
  });

  test('commits object decision', () => {
    const decision = { action: 'proceed', priority: 'high' };
    const result = commitFieldDecision(decision);
    expect(result.decided).toBe(true);
    expect(result.value).toEqual(decision);
  });

  test('commits boolean decision', () => {
    const result = commitFieldDecision(true);
    expect(result.decided).toBe(true);
    expect(result.value).toBe(true);
  });

  test('commits null decision', () => {
    const result = commitFieldDecision(null);
    expect(result.decided).toBe(true);
    expect(result.value).toBe(null);
  });
});
