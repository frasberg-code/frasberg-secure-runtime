/**
 * error_propagation.test.ts
 * Tests that errors are properly caught and structured
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { CapabilityRouter } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capability_router.ts";

Deno.test("Handler errors are caught and returned as structured errors", async () => {
  const router = new CapabilityRouter();

  const failingHandler = async () => {
    throw new Error('Test error message');
  };

  router.register('failing.capability', 'test_engine', failingHandler);

  const result = await router.call('failing.capability', {});
  
  assertEquals(result.success, false);
  assertExists(result.error);
  assertEquals(result.error, 'Test error message');
  assertEquals(result.engineId, 'test_engine');
  assertEquals(result.capability, 'failing.capability');
});

Deno.test("Non-Error exceptions are handled", async () => {
  const router = new CapabilityRouter();

  const failingHandler = async () => {
    throw 'String error';
  };

  router.register('failing.capability', 'test_engine', failingHandler);

  const result = await router.call('failing.capability', {});
  
  assertEquals(result.success, false);
  assertExists(result.error);
  assertEquals(result.error, 'Unknown error');
});

Deno.test("Missing capability returns structured error", async () => {
  const router = new CapabilityRouter();

  const result = await router.call('nonexistent.capability', {});
  
  assertEquals(result.success, false);
  assertExists(result.error);
  assertEquals(result.error, 'Capability "nonexistent.capability" not found');
  assertEquals(result.capability, 'nonexistent.capability');
});

Deno.test("Duplicate capability registration throws error", () => {
  const router = new CapabilityRouter();

  const handler = async () => ({ result: 'test' });

  router.register('test.capability', 'engine1', handler);

  let errorThrown = false;
  try {
    router.register('test.capability', 'engine2', handler);
  } catch (error) {
    errorThrown = true;
    assertEquals(
      error.message,
      'Capability "test.capability" is already registered by engine "engine1"'
    );
  }

  assertEquals(errorThrown, true);
});
