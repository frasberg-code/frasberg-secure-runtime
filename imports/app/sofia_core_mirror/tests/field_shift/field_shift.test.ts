import { shiftFieldState } from '../../supabase/sofia_core/field_shift/field_shift';

describe('field_shift', () => {
  test('shifts field using shifter', () => {
    const shifter = (x: number) => x * -1;
    const result = shiftFieldState(3, shifter);
    expect(result.shifted).toBe(true);
    expect(result.value).toBe(-3);
  });

  test('shifts string field', () => {
    const shifter = (x: string) => `shifted:${x}`;
    const result = shiftFieldState('mod', shifter);
    expect(result.shifted).toBe(true);
    expect(result.value).toBe('shifted:mod');
  });

  test('shifts object field', () => {
    const shifter = (x: { direction: string }) => ({ direction: `new_${x.direction}` });
    const result = shiftFieldState({ direction: 'north' }, shifter);
    expect(result.shifted).toBe(true);
    expect(result.value).toEqual({ direction: 'new_north' });
  });

  test('shifts field with identity shifter', () => {
    const shifter = (x: number) => x;
    const result = shiftFieldState(99, shifter);
    expect(result.shifted).toBe(true);
    expect(result.value).toBe(99);
  });

  test('shifts array field', () => {
    const shifter = (x: string[]) => x.reverse();
    const result = shiftFieldState(['A', 'B', 'C'], shifter);
    expect(result.shifted).toBe(true);
    expect(result.value).toEqual(['C', 'B', 'A']);
  });
});
