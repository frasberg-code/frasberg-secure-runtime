/**
 * context_propagation.test.ts
 * Tests that context is passed through to capability handlers
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { CapabilityRouter } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_capability_router.ts";

Deno.test("Context is passed to capability handlers", async () => {
  const testContext = {
    requestId: 'test-123',
    userId: 'user-456',
    timestamp: Date.now()
  };

  const router = new CapabilityRouter(testContext);

  // Register a test handler that checks context
  const testHandler = async (input: any, context: any) => {
    assertExists(context);
    assertEquals(context.requestId, testContext.requestId);
    assertEquals(context.userId, testContext.userId);
    return { success: true, contextReceived: true };
  };

  router.register('test.capability', 'test_engine', testHandler);

  const result = await router.call('test.capability', {});
  assertEquals(result.success, true);
  assertEquals(result.data.contextReceived, true);
});

Deno.test("Context can be updated after router creation", async () => {
  const router = new CapabilityRouter({ initial: true });

  const testHandler = async (input: any, context: any) => {
    return { contextValue: context.testValue };
  };

  router.register('test.capability', 'test_engine', testHandler);

  // Update context
  router.setContext({ testValue: 'updated' });

  const result = await router.call('test.capability', {});
  assertEquals(result.data.contextValue, 'updated');
});

Deno.test("Context is available via getContext()", () => {
  const testContext = { test: 'value' };
  const router = new CapabilityRouter(testContext);
  
  const retrievedContext = router.getContext();
  assertEquals(retrievedContext.test, 'value');
});
