import { fieldContinuumII } from '../../supabase/sofia_core/sofia_core_runtime';

describe('sofia_core_runtime - fieldContinuumII integration', () => {
  test('fieldContinuumII exports stabilizeFieldCycle', () => {
    expect(fieldContinuumII.stabilizeFieldCycle).toBeDefined();
    const result = fieldContinuumII.stabilizeFieldCycle(5, x => x * 2);
    expect(result.stabilized).toBe(true);
    expect(result.value).toBe(10);
  });

  test('fieldContinuumII exports extendFieldContinuum', () => {
    expect(fieldContinuumII.extendFieldContinuum).toBeDefined();
    const result = fieldContinuumII.extendFieldContinuum('test', x => `${x}:extended`);
    expect(result.extended).toBe(true);
    expect(result.value).toBe('test:extended');
  });

  test('fieldContinuumII exports synthesizeFieldContinuum', () => {
    expect(fieldContinuumII.synthesizeFieldContinuum).toBeDefined();
    const result = fieldContinuumII.synthesizeFieldContinuum([1, 2, 3], x => x.length);
    expect(result.synthesized).toBe(true);
    expect(result.value).toBe(3);
  });
});
