// tests/frasberg_ai_application_shell/engine_registry.test.ts

import { initializeFrasbergAppShell, resetRuntime } from '../../supabase/frasberg_ai/frasberg_ai_application_shell/app_shell_runtime';
import { resetContext } from '../../supabase/frasberg_ai/frasberg_ai_application_shell/app_shell_context';
import { resetLifecycleState } from '../../supabase/frasberg_ai/frasberg_ai_application_shell/app_shell_lifecycle';
import manifest from '../../supabase/frasberg_ai/frasberg_ai_application_shell/app_shell_manifest.json';

describe('Frasberg AI Application Shell — Engine Registry Audit', () => {
  beforeEach(() => {
    resetContext();
    resetLifecycleState();
    resetRuntime();
  });

  test('all enabled engines in manifest are registered and initialized', async () => {
    const runtime = await initializeFrasbergAppShell({}, { audit: true });

    const expectedEngines = manifest.engines
      .filter(e => e.enabled)
      .map(e => e.id);

    expect(runtime.lifecycle).toBeDefined();
    expect(runtime.lifecycle?.engines).toBeDefined();
    
    const registeredEngines = runtime.lifecycle!.engines.map(e => e.id);

    for (const engineId of expectedEngines) {
      expect(registeredEngines).toContain(engineId);
    }
  });
});
