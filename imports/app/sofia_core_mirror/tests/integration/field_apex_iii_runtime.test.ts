import { fieldApexIII } from '../../supabase/sofia_core/sofia_core_runtime';

describe('field_apex_iii_runtime', () => {
  test('fieldApexIII is exported', () => {
    expect(fieldApexIII).toBeDefined();
  });

  test('fieldApexIII contains all three functions', () => {
    expect(typeof fieldApexIII.formFieldPeakIII).toBe('function');
    expect(typeof fieldApexIII.focusFieldPeakIII).toBe('function');
    expect(typeof fieldApexIII.expressApexStateIII).toBe('function');
  });

  test('fieldApexIII functions work correctly in sequence', () => {
    // Form peak from dominion
    const peakResult = fieldApexIII.formFieldPeakIII(100, (x: number) => x * 2);
    expect(peakResult.peaked).toBe(true);
    expect(peakResult.value).toBe(200);

    // Focus the peak
    const focusResult = fieldApexIII.focusFieldPeakIII(peakResult.value, (x: number) => x / 2);
    expect(focusResult.focused).toBe(true);
    expect(focusResult.value).toBe(100);

    // Express the apex
    const expressResult = fieldApexIII.expressApexStateIII(focusResult.value, (x: number) => x * 3);
    expect(expressResult.expressed).toBe(true);
    expect(expressResult.value).toBe(300);
  });

  test('fieldApexIII string processing pipeline', () => {
    const peakResult = fieldApexIII.formFieldPeakIII('dominion3', (x: string) => `peak:${x}`);
    expect(peakResult.peaked).toBe(true);
    expect(peakResult.value).toBe('peak:dominion3');

    const focusResult = fieldApexIII.focusFieldPeakIII(peakResult.value, (x: string) => x.toUpperCase());
    expect(focusResult.focused).toBe(true);
    expect(focusResult.value).toBe('PEAK:DOMINION3');

    const expressResult = fieldApexIII.expressApexStateIII(focusResult.value, (x: string) => `[${x}]`);
    expect(expressResult.expressed).toBe(true);
    expect(expressResult.value).toBe('[PEAK:DOMINION3]');
  });
});
