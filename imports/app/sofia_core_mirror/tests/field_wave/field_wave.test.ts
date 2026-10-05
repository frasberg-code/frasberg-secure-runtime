import { generateWave } from '../../supabase/sofia_core/field_wave/field_wave';

describe('field_wave', () => {
  test('generates wave with correct length', () => {
    const wave = generateWave(5, 8);
    expect(wave.length).toBe(8);
  });

  test('generates wave with amplitude 1', () => {
    const wave = generateWave(1, 4);
    expect(wave.length).toBe(4);
    expect(Math.abs(wave[0])).toBeLessThanOrEqual(1);
  });

  test('generates wave with different frequency', () => {
    const wave = generateWave(10, 16);
    expect(wave.length).toBe(16);
  });

  test('wave respects amplitude scaling', () => {
    const amplitude = 5;
    const wave = generateWave(amplitude, 8);
    const maxValue = Math.max(...wave.map(Math.abs));
    expect(maxValue).toBeLessThanOrEqual(amplitude);
  });

  test('generates sine wave pattern', () => {
    const wave = generateWave(1, 4);
    expect(wave[0]).toBeCloseTo(0, 10);
    expect(wave[1]).toBeCloseTo(1, 10);
    expect(wave[2]).toBeCloseTo(0, 10);
    expect(wave[3]).toBeCloseTo(-1, 10);
  });

  test('handles zero frequency', () => {
    const wave = generateWave(5, 0);
    expect(wave.length).toBe(0);
  });

  test('handles large frequency', () => {
    const wave = generateWave(10, 100);
    expect(wave.length).toBe(100);
  });
});
