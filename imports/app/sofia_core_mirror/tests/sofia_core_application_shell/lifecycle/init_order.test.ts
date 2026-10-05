/**
 * init_order.test.ts
 * Confirms engines initialize in correct sequence based on manifest order and declared dependencies.
 */

import { initializeSofiaAppShell, resetRuntime } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_runtime';
import { resetContext } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_context';
import { resetLifecycleState, getLifecycleLogs } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_lifecycle';
import manifest from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_manifest.json';

describe('Sofia Core Application Shell — Init Order', () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test('engines initialize in dependency order', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // deviation_engine has no dependencies, should init first
    expect(initLogs[0].engineId).toBe('deviation_engine');

    // identity_filter depends on deviation_engine
    const identityFilterLog = initLogs.find(log => log.engineId === 'identity_filter');
    const deviationLog = initLogs.find(log => log.engineId === 'deviation_engine');
    expect(identityFilterLog).toBeDefined();
    expect(deviationLog).toBeDefined();
    expect(initLogs.indexOf(identityFilterLog!)).toBeGreaterThan(initLogs.indexOf(deviationLog!));

    // tonal_engine depends on both deviation_engine and identity_filter
    const tonalLog = initLogs.find(log => log.engineId === 'tonal_engine');
    expect(tonalLog).toBeDefined();
    expect(initLogs.indexOf(tonalLog!)).toBeGreaterThan(initLogs.indexOf(deviationLog!));
    expect(initLogs.indexOf(tonalLog!)).toBeGreaterThan(initLogs.indexOf(identityFilterLog!));
  });

  test('all enabled engines are initialized', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    const expectedEngines = manifest.engines
      .filter(e => e.enabled)
      .map(e => e.id);

    const initializedEngines = initLogs.map(log => log.engineId);

    for (const engineId of expectedEngines) {
      expect(initializedEngines).toContain(engineId);
    }
  });

  test('init order respects manifest sequence for engines with no dependencies', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // deviation_engine and sofia_api both have no dependencies
    // They should initialize in manifest order
    const deviationIndex = initLogs.findIndex(log => log.engineId === 'deviation_engine');
    const sofiaApiIndex = initLogs.findIndex(log => log.engineId === 'sofia_api');

    expect(deviationIndex).toBeLessThan(sofiaApiIndex);
  });
});
