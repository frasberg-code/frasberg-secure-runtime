import { generatePulse } from '../../supabase/sofia_core/field_pulse/field_pulse';

describe('field_pulse', () => {
  test('generates correct number of pulses', () => {
    const pulses = generatePulse(3, 5);
    expect(pulses.length).toBe(5);
  });

  test('generates pulses with correct intensity', () => {
    const pulses = generatePulse(7, 3);
    expect(pulses).toEqual([7, 7, 7]);
  });

  test('handles zero intensity', () => {
    const pulses = generatePulse(0, 4);
    expect(pulses).toEqual([0, 0, 0, 0]);
  });

  test('handles negative intensity', () => {
    const pulses = generatePulse(-5, 3);
    expect(pulses).toEqual([-5, -5, -5]);
  });

  test('handles single pulse', () => {
    const pulses = generatePulse(10, 1);
    expect(pulses).toEqual([10]);
  });

  test('handles zero interval', () => {
    const pulses = generatePulse(5, 0);
    expect(pulses).toEqual([]);
  });

  test('handles large interval', () => {
    const pulses = generatePulse(2, 100);
    expect(pulses.length).toBe(100);
    expect(pulses[0]).toBe(2);
    expect(pulses[99]).toBe(2);
  });
});
