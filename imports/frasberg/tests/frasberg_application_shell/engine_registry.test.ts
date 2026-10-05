// tests/frasberg_application_shell/engine_registry.test.ts

import { initializeFrasbergAppShell, resetRuntime } from '../../supabase/frasberg/frasberg_application_shell/app_shell_runtime';
import { resetContext } from '../../supabase/frasberg/frasberg_application_shell/app_shell_context';
import { resetLifecycleState } from '../../supabase/frasberg/frasberg_application_shell/app_shell_lifecycle';
import manifest from '../../supabase/frasberg/frasberg_application_shell/app_shell_manifest.json';

describe('Frasberg Application Shell — Engine Registry Audit', () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test('all enabled engines in manifest are registered and initialized', async () => {
    const runtime = await initializeFrasbergAppShell({}, { audit: true });

    const expectedEngines = manifest.engines
      .filter((e: { enabled: boolean; id: string }) => e.enabled)
      .map((e: { enabled: boolean; id: string }) => e.id);

    expect(runtime.lifecycle).toBeDefined();
    expect(runtime.lifecycle?.engines).toBeDefined();
    
    const registeredEngines = runtime.lifecycle!.engines.map((e: { id: string }) => e.id);

    for (const engineId of expectedEngines) {
      expect(registeredEngines).toContain(engineId);
    }
  });
});
