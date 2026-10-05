import { fieldApexII } from '../../supabase/sofia_core/sofia_core_runtime';

describe('field_apex_ii_runtime', () => {
  test('fieldApexII is exported', () => {
    expect(fieldApexII).toBeDefined();
  });

  test('fieldApexII contains all three functions', () => {
    expect(typeof fieldApexII.formFieldPeakII).toBe('function');
    expect(typeof fieldApexII.focusFieldPeakII).toBe('function');
    expect(typeof fieldApexII.expressApexIIState).toBe('function');
  });

  test('fieldApexII functions work correctly in sequence', () => {
    // Form peak from dominion
    const peakResult = fieldApexII.formFieldPeakII(100, (x: number) => x * 2);
    expect(peakResult.peaked).toBe(true);
    expect(peakResult.value).toBe(200);

    // Focus the peak
    const focusResult = fieldApexII.focusFieldPeakII(peakResult.value, (x: number) => x / 2);
    expect(focusResult.focused).toBe(true);
    expect(focusResult.value).toBe(100);

    // Express the apex
    const expressResult = fieldApexII.expressApexIIState(focusResult.value, (x: number) => x * 3);
    expect(expressResult.expressed).toBe(true);
    expect(expressResult.value).toBe(300);
  });

  test('fieldApexII string processing pipeline', () => {
    const peakResult = fieldApexII.formFieldPeakII('dominion2', (x: string) => `peak:${x}`);
    expect(peakResult.peaked).toBe(true);
    expect(peakResult.value).toBe('peak:dominion2');

    const focusResult = fieldApexII.focusFieldPeakII(peakResult.value, (x: string) => x.toUpperCase());
    expect(focusResult.focused).toBe(true);
    expect(focusResult.value).toBe('PEAK:DOMINION2');

    const expressResult = fieldApexII.expressApexIIState(focusResult.value, (x: string) => `[${x}]`);
    expect(expressResult.expressed).toBe(true);
    expect(expressResult.value).toBe('[PEAK:DOMINION2]');
  });
});
