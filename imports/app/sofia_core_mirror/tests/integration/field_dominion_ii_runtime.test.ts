import { fieldDominionII } from '../../supabase/sofia_core/sofia_core_runtime';

describe('Field Dominion-II Runtime Integration', () => {
  test('fieldDominionII exports all three functions', () => {
    expect(fieldDominionII).toBeDefined();
    expect(fieldDominionII.establishAuthorityCycle).toBeDefined();
    expect(fieldDominionII.projectDominion).toBeDefined();
    expect(fieldDominionII.continueDominion).toBeDefined();
  });

  test('fieldDominionII.establishAuthorityCycle creates authoritative state', () => {
    const result = fieldDominionII.establishAuthorityCycle(
      'continuum-synthesis',
      (x) => `authority-${x}`
    );
    expect(result.authoritative).toBe(true);
    expect(result.value).toBe('authority-continuum-synthesis');
  });

  test('fieldDominionII.projectDominion projects authority', () => {
    const result = fieldDominionII.projectDominion(
      'authority-cycle',
      (x) => `projected-${x}`
    );
    expect(result.projected).toBe(true);
    expect(result.value).toBe('projected-authority-cycle');
  });

  test('fieldDominionII.continueDominion maintains continuity', () => {
    const result = fieldDominionII.continueDominion(
      'dominion-projection',
      (x) => `continuous-${x}`
    );
    expect(result.continuous).toBe(true);
    expect(result.value).toBe('continuous-dominion-projection');
  });

  test('full pipeline: continuum → authority → projection → continuity', () => {
    // Simulate continuum synthesis
    const continuumSynthesis = { cycles: [1, 2, 3], unified: true };

    // Step 1: Establish authority
    const authorityCycle = fieldDominionII.establishAuthorityCycle(
      continuumSynthesis,
      (x) => ({ ...x, authority: 'established' })
    );
    expect(authorityCycle.authoritative).toBe(true);
    expect((authorityCycle.value as any).authority).toBe('established');

    // Step 2: Project dominion
    const dominionProjection = fieldDominionII.projectDominion(
      authorityCycle.value,
      (x) => ({ ...x, domains: ['domain1', 'domain2'] })
    );
    expect(dominionProjection.projected).toBe(true);
    expect((dominionProjection.value as any).domains).toEqual(['domain1', 'domain2']);

    // Step 3: Continue dominion
    const dominionContinuity = fieldDominionII.continueDominion(
      dominionProjection.value,
      (x) => ({ ...x, sovereign: true })
    );
    expect(dominionContinuity.continuous).toBe(true);
    expect((dominionContinuity.value as any).sovereign).toBe(true);
    expect((dominionContinuity.value as any).cycles).toEqual([1, 2, 3]);
    expect((dominionContinuity.value as any).authority).toBe('established');
    expect((dominionContinuity.value as any).domains).toEqual(['domain1', 'domain2']);
  });
});
