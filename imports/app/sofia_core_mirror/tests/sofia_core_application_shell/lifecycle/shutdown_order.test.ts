/**
 * shutdown_order.test.ts
 * Confirms engines shut down in reverse order, respecting dependency teardown.
 */

import { initializeSofiaAppShell, resetRuntime, shutdownSofiaAppShell } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_runtime';
import { resetContext } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_context';
import { resetLifecycleState, getLifecycleLogs } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_lifecycle';

describe('Sofia Core Application Shell — Shutdown Order', () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test('engines shutdown in reverse dependency order', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });
    await shutdownSofiaAppShell();

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');
    const shutdownLogs = logs.filter(log => log.type === 'shutdown');

    // Shutdown order should be reverse of init order
    expect(shutdownLogs.length).toBe(initLogs.length);

    for (let i = 0; i < initLogs.length; i++) {
      const initEngineId = initLogs[i].engineId;
      const shutdownEngineId = shutdownLogs[shutdownLogs.length - 1 - i].engineId;
      expect(shutdownEngineId).toBe(initEngineId);
    }
  });

  test('engines depending on others shutdown first', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });
    await shutdownSofiaAppShell();

    const logs = getLifecycleLogs();
    const shutdownLogs = logs.filter(log => log.type === 'shutdown');

    // tonal_engine depends on identity_filter and deviation_engine
    // so it should shutdown before them
    const tonalIndex = shutdownLogs.findIndex(log => log.engineId === 'tonal_engine');
    const identityIndex = shutdownLogs.findIndex(log => log.engineId === 'identity_filter');
    const deviationIndex = shutdownLogs.findIndex(log => log.engineId === 'deviation_engine');

    expect(tonalIndex).toBeLessThan(identityIndex);
    expect(tonalIndex).toBeLessThan(deviationIndex);

    // identity_filter depends on deviation_engine
    // so it should shutdown before deviation_engine
    expect(identityIndex).toBeLessThan(deviationIndex);
  });

  test('shutdown completes cleanly without errors', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });
    
    await expect(shutdownSofiaAppShell()).resolves.not.toThrow();

    const logs = getLifecycleLogs();
    const errorLogs = logs.filter(log => log.type === 'error');

    expect(errorLogs.length).toBe(0);
  });
});
