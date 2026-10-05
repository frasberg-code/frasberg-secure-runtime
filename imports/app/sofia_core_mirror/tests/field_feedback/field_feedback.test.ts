import { captureFieldFeedback } from '../../supabase/sofia_core/field_feedback/field_feedback';

describe('field_feedback', () => {
  test('captures feedback using translator', () => {
    const translator = (x: string) => `feedback:${x}`;
    const result = captureFieldFeedback('OK', translator);
    expect(result.received).toBe(true);
    expect(result.signal).toBe('feedback:OK');
  });

  test('captures numeric feedback', () => {
    const translator = (x: number) => x + 100;
    const result = captureFieldFeedback(42, translator);
    expect(result.received).toBe(true);
    expect(result.signal).toBe(142);
  });

  test('captures object feedback', () => {
    const translator = (x: { status: string }) => ({ status: `fb_${x.status}` });
    const result = captureFieldFeedback({ status: 'SUCCESS' }, translator);
    expect(result.received).toBe(true);
    expect(result.signal).toEqual({ status: 'fb_SUCCESS' });
  });

  test('captures with identity translator', () => {
    const translator = (x: string) => x;
    const result = captureFieldFeedback('DONE', translator);
    expect(result.received).toBe(true);
    expect(result.signal).toBe('DONE');
  });

  test('captures array feedback', () => {
    const translator = (x: string[]) => x.map(s => s.toLowerCase());
    const result = captureFieldFeedback(['ERROR', 'WARNING'], translator);
    expect(result.received).toBe(true);
    expect(result.signal).toEqual(['error', 'warning']);
  });
});
