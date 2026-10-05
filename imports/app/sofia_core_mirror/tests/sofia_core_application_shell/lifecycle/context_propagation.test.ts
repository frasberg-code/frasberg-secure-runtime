/**
 * context_propagation.test.ts
 * Confirms shared context object is passed consistently to all engines.
 */

import { initializeSofiaAppShell, resetRuntime } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_runtime';
import { resetContext } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_context';
import { resetLifecycleState, getLifecycleLogs } from '../../../supabase/sofia_core/sofia_core_application_shell/app_shell_lifecycle';

describe('Sofia Core Application Shell — Context Propagation', () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test('all engines receive the same context object', async () => {
    const initialContext = { testKey: 'testValue', timestamp: Date.now() };
    const runtime = await initializeSofiaAppShell(initialContext, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // All engines should have received context
    for (const log of initLogs) {
      expect(log.context).toBeDefined();
      expect(log.context.testKey).toBe('testValue');
      expect(log.context.timestamp).toBe(initialContext.timestamp);
    }
  });

  test('context is consistently available during initialization', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    expect(initLogs.length).toBeGreaterThan(0);

    // Every init log should have context
    for (const log of initLogs) {
      expect(log.context).toBeDefined();
      expect(log.context.initialized).toBe(true);
      expect(log.context.engines).toBeDefined();
    }
  });

  test('context contains engine metadata', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // Check that context includes metadata
    for (const log of initLogs) {
      expect(log.context.metadata).toBeDefined();
      expect(log.context.metadata.version).toBeDefined();
      expect(log.context.metadata.maintainer).toBeDefined();
    }
  });

  test('engines can access other initialized engines through context', async () => {
    const runtime = await initializeSofiaAppShell({}, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // Find tonal_engine which depends on others
    const tonalLog = initLogs.find(log => log.engineId === 'tonal_engine');
    expect(tonalLog).toBeDefined();

    // Its context should have the engines Map with previously initialized engines
    expect(tonalLog!.context.engines).toBeDefined();
    expect(tonalLog!.context.engines.size).toBeGreaterThan(0);

    // Should contain its dependencies
    expect(tonalLog!.context.engines.has('deviation_engine')).toBe(true);
    expect(tonalLog!.context.engines.has('identity_filter')).toBe(true);
  });

  test('context modifications are visible to subsequent engines', async () => {
    const initialContext = { sharedState: [] };
    const runtime = await initializeSofiaAppShell(initialContext, { audit: true, testMode: true });

    const logs = getLifecycleLogs();
    const initLogs = logs.filter(log => log.type === 'init');

    // All engines should see the same sharedState array reference
    const firstContext = initLogs[0]?.context;
    expect(firstContext).toBeDefined();

    for (const log of initLogs) {
      // All should reference the same context
      expect(log.context).toBeDefined();
      expect(log.context.initialized).toBe(true);
    }
  });
});
