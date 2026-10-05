/**
 * error_propagation.test.ts
 * Simulates a failing engine and confirms error surfaces cleanly, halts chain, and logs appropriately.
 */

import { initializeSofiaAppShell, resetRuntime } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_runtime';
import { resetContext } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_context';
import { resetLifecycleState, getLifecycleLogs, setEngineErrorSimulation } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_lifecycle';

describe('Sofia Core Application Shell — Error Propagation', () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test('engine initialization error is caught and logged', async () => {
    // Simulate an error in identity_filter initialization
    setEngineErrorSimulation('identity_filter', 'Simulated initialization error');

    try {
      await initializeSofiaAppShell({}, { audit: true, testMode: true });
      // Should not reach here if error handling works
      expect(true).toBe(false);
    } catch (error) {
      // Error should be caught
      expect(error).toBeDefined();
    }

    const logs = getLifecycleLogs();
    const errorLogs = logs.filter(log => log.type === 'error');

    expect(errorLogs.length).toBeGreaterThan(0);
    expect(errorLogs.some(log => log.engineId === 'identity_filter')).toBe(true);
  });

  test('dependent engines do not initialize when dependency fails', async () => {
    // Simulate an error in deviation_engine
    setEngineErrorSimulation('deviation_engine', 'Simulated dependency error');

    try {
      await initializeSofiaAppShell({}, { audit: true, testMode: true });
    } catch (error) {
      // Expected to fail
    }

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // identity_filter depends on deviation_engine, should not initialize
    const identityFilterLog = initLogs.find(log => log.engineId === 'identity_filter');
    expect(identityFilterLog).toBeUndefined();

    // tonal_engine depends on deviation_engine, should not initialize
    const tonalLog = initLogs.find(log => log.engineId === 'tonal_engine');
    expect(tonalLog).toBeUndefined();
  });

  test('error message is descriptive and includes engine name', async () => {
    setEngineErrorSimulation('membrane_engine', 'Test error message');

    try {
      await initializeSofiaAppShell({}, { audit: true, testMode: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      expect(errorMessage).toContain('membrane_engine');
    }

    const logs = getLifecycleLogs();
    const errorLogs = logs.filter(log => log.type === 'error');

    expect(errorLogs.length).toBeGreaterThan(0);
    const membraneError = errorLogs.find(log => log.engineId === 'membrane_engine');
    expect(membraneError).toBeDefined();
    expect(membraneError!.message).toContain('Test error message');
  });

  test('initialization chain halts on first error', async () => {
    // Simulate error in second engine to load
    setEngineErrorSimulation('identity_filter', 'Chain halt test');

    try {
      await initializeSofiaAppShell({}, { audit: true, testMode: true });
    } catch (error) {
      // Expected
    }

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // Only engines before identity_filter should have initialized
    expect(initLogs.some(log => log.engineId === 'deviation_engine')).toBe(true);
    
    // Engines after or depending on identity_filter should not have initialized
    const tonalLog = initLogs.find(log => log.engineId === 'tonal_engine');
    expect(tonalLog).toBeUndefined();
  });
});
