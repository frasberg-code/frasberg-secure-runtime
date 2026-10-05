import { establishFieldPresence } from '../../supabase/sofia_core/field_presence/field_presence';

describe('field_presence', () => {
  test('establishes presence using presencer', () => {
    const presencer = (x: string) => `presence:${x}`;
    const result = establishFieldPresence('ID', presencer);
    expect(result.present).toBe(true);
    expect(result.state).toBe('presence:ID');
  });

  test('establishes numeric presence', () => {
    const presencer = (x: number) => x + 100;
    const result = establishFieldPresence(5, presencer);
    expect(result.present).toBe(true);
    expect(result.state).toBe(105);
  });

  test('establishes object presence', () => {
    const presencer = (x: { id: string }) => ({ id: `present_${x.id}` });
    const result = establishFieldPresence({ id: 'ALPHA' }, presencer);
    expect(result.present).toBe(true);
    expect(result.state).toEqual({ id: 'present_ALPHA' });
  });

  test('establishes presence with identity presencer', () => {
    const presencer = (x: string) => x;
    const result = establishFieldPresence('IDENTITY', presencer);
    expect(result.present).toBe(true);
    expect(result.state).toBe('IDENTITY');
  });

  test('establishes array presence', () => {
    const presencer = (x: string[]) => x.map(s => `present:${s}`);
    const result = establishFieldPresence(['A', 'B'], presencer);
    expect(result.present).toBe(true);
    expect(result.state).toEqual(['present:A', 'present:B']);
  });
});
