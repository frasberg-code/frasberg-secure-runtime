/**
 * correct_engine_routing.test.ts
 * Tests that calls are routed to the correct engine
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createRouterWithHandlers } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capability_router.ts";
import { handlers as identityHandlers } from "../../../supabase/sofia_core/identity_filter/handlers.ts";
import { handlers as deviationHandlers } from "../../../supabase/sofia_core/deviation_engine/handlers.ts";
import { handlers as membraneHandlers } from "../../../supabase/sofia_core/membrane_engine/handlers.ts";
import { handlers as tonalHandlers } from "../../../supabase/sofia_core/tonal_engine/handlers.ts";
import { handlers as apiHandlers } from "../../../supabase/sofia_core/sofia_api/handlers.ts";

Deno.test("Identity capabilities route to identity_filter engine", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers },
    { engineId: 'deviation_engine', handlers: deviationHandlers }
  ]);

  const resolveResult = await router.call('identity.resolve', {});
  assertEquals(resolveResult.engineId, 'identity_filter');
  
  const normalizeResult = await router.call('identity.normalize', {});
  assertEquals(normalizeResult.engineId, 'identity_filter');
});

Deno.test("Deviation capabilities route to deviation_engine", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers },
    { engineId: 'deviation_engine', handlers: deviationHandlers }
  ]);

  const computeResult = await router.call('deviation.compute', {});
  assertEquals(computeResult.engineId, 'deviation_engine');
  
  const analyzeResult = await router.call('deviation.analyze', {});
  assertEquals(analyzeResult.engineId, 'deviation_engine');
});

Deno.test("Membrane capabilities route to membrane_engine", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'membrane_engine', handlers: membraneHandlers }
  ]);

  const filterResult = await router.call('membrane.filter', {});
  assertEquals(filterResult.engineId, 'membrane_engine');
  
  const transformResult = await router.call('membrane.transform', {});
  assertEquals(transformResult.engineId, 'membrane_engine');
});

Deno.test("Tonal capabilities route to tonal_engine", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'tonal_engine', handlers: tonalHandlers }
  ]);

  const generateResult = await router.call('tone.generate', {});
  assertEquals(generateResult.engineId, 'tonal_engine');
  
  const adjustResult = await router.call('tone.adjust', {});
  assertEquals(adjustResult.engineId, 'tonal_engine');
});

Deno.test("API capabilities route to sofia_api engine", async () => {
  const router = createRouterWithHandlers([
    { engineId: 'sofia_api', handlers: apiHandlers }
  ]);

  const respondResult = await router.call('api.respond', {});
  assertEquals(respondResult.engineId, 'sofia_api');
  
  const composeResult = await router.call('api.compose', {});
  assertEquals(composeResult.engineId, 'sofia_api');
});
