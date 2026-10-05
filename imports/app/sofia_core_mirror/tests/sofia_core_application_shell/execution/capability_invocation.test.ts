/**
 * capability_invocation.test.ts
 * Tests that capabilities can be invoked through the router
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { CapabilityRouter, createRouterWithHandlers } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capability_router.ts";
import { handlers as identityHandlers } from "../../../supabase/sofia_core/identity_filter/handlers.ts";
import { handlers as deviationHandlers } from "../../../supabase/sofia_core/deviation_engine/handlers.ts";
import { handlers as membraneHandlers } from "../../../supabase/sofia_core/membrane_engine/handlers.ts";
import { handlers as tonalHandlers } from "../../../supabase/sofia_core/tonal_engine/handlers.ts";
import { handlers as apiHandlers } from "../../../supabase/sofia_core/sofia_api/handlers.ts";

Deno.test("Capability can be invoked through router", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers },
    { engineId: 'deviation_engine', handlers: deviationHandlers },
    { engineId: 'membrane_engine', handlers: membraneHandlers },
    { engineId: 'tonal_engine', handlers: tonalHandlers },
    { engineId: 'sofia_api', handlers: apiHandlers }
  ]);

  const result = await router.call('identity.resolve', { rawIdentity: 'testUser' });
  
  assertEquals(result.success, true);
  assertExists(result.data);
  assertEquals(result.engineId, 'identity_filter');
  assertEquals(result.capability, 'identity.resolve');
});

Deno.test("All engine capabilities can be invoked", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers },
    { engineId: 'deviation_engine', handlers: deviationHandlers },
    { engineId: 'membrane_engine', handlers: membraneHandlers },
    { engineId: 'tonal_engine', handlers: tonalHandlers },
    { engineId: 'sofia_api', handlers: apiHandlers }
  ]);

  const capabilities = [
    'identity.resolve',
    'identity.normalize',
    'deviation.compute',
    'deviation.analyze',
    'membrane.filter',
    'membrane.transform',
    'tone.generate',
    'tone.adjust',
    'api.respond',
    'api.compose'
  ];

  for (const capability of capabilities) {
    const result = await router.call(capability, {});
    assertEquals(result.success, true, `Capability ${capability} should succeed`);
    assertExists(result.data, `Capability ${capability} should return data`);
  }
});

Deno.test("Router returns error for missing capability", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers }
  ]);

  const result = await router.call('nonexistent.capability', {});
  
  assertEquals(result.success, false);
  assertExists(result.error);
  assertEquals(result.error, 'Capability "nonexistent.capability" not found');
});
