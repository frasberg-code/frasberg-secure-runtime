/**
 * router_inspection.test.ts
 * Tests router introspection capabilities
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { createRouterWithHandlers } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capability_router.ts";
import { handlers as identityHandlers } from "../../../supabase/sofia_core/identity_filter/handlers.ts";
import { handlers as deviationHandlers } from "../../../supabase/sofia_core/deviation_engine/handlers.ts";

Deno.test("Router reports all registered capabilities", () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers },
    { engineId: 'deviation_engine', handlers: deviationHandlers }
  ]);

  const capabilities = router.getCapabilities();
  
  assertEquals(capabilities.includes('identity.resolve'), true);
  assertEquals(capabilities.includes('identity.normalize'), true);
  assertEquals(capabilities.includes('deviation.compute'), true);
  assertEquals(capabilities.includes('deviation.analyze'), true);
  assertEquals(capabilities.length, 4);
});

Deno.test("hasCapability() correctly identifies registered capabilities", () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers }
  ]);

  assertEquals(router.hasCapability('identity.resolve'), true);
  assertEquals(router.hasCapability('identity.normalize'), true);
  assertEquals(router.hasCapability('nonexistent.capability'), false);
});

Deno.test("getEngineForCapability() returns correct engine ID", () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers },
    { engineId: 'deviation_engine', handlers: deviationHandlers }
  ]);

  assertEquals(router.getEngineForCapability('identity.resolve'), 'identity_filter');
  assertEquals(router.getEngineForCapability('deviation.compute'), 'deviation_engine');
  assertEquals(router.getEngineForCapability('nonexistent.capability'), undefined);
});

Deno.test("getRoutingTable() returns routing information", () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers }
  ]);

  const routingTable = router.getRoutingTable();
  
  assertEquals(routingTable['identity.resolve'].engineId, 'identity_filter');
  assertEquals(routingTable['identity.normalize'].engineId, 'identity_filter');
  assertEquals(typeof routingTable['identity.resolve'].handler, 'function');
});

Deno.test("clear() removes all registered capabilities", () => {
  const router = createRouterWithHandlers([
    { engineId: 'identity_filter', handlers: identityHandlers }
  ]);

  assertEquals(router.getCapabilities().length, 2);
  
  router.clear();
  
  assertEquals(router.getCapabilities().length, 0);
  assertEquals(router.hasCapability('identity.resolve'), false);
});
