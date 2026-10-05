import { runPipeline } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_pipeline.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Pipeline maintains runtime context", async () => {
  const contextLog: string[] = [];
  
  const mockRuntime = {
    sessionId: "test-session-123",
    userId: "user-456",
    call: async (capability: string, input: any) => {
      // Access context properties
      contextLog.push(`${capability}:${mockRuntime.sessionId}`);
      
      return {
        success: true,
        output: input,
        engineId: "test",
        capability
      };
    }
  };

  const pipeline = [
    "identity.resolve",
    "deviation.compute",
    "tone.generate"
  ];

  const result = await runPipeline(mockRuntime, pipeline, "input");

  assertEquals(result.success, true);
  assertEquals(contextLog.length, 3);
  assertEquals(contextLog[0], "identity.resolve:test-session-123");
  assertEquals(contextLog[1], "deviation.compute:test-session-123");
  assertEquals(contextLog[2], "tone.generate:test-session-123");
});

Deno.test("Pipeline runtime call method receives context", async () => {
  let capturedContext: any = null;
  
  const mockRuntime = {
    metadata: { timestamp: Date.now() },
    call: async (capability: string, input: any) => {
      capturedContext = { capability, metadata: mockRuntime.metadata };
      
      return {
        success: true,
        output: input,
        engineId: "test",
        capability
      };
    }
  };

  const pipeline = ["identity.resolve"];

  await runPipeline(mockRuntime, pipeline, "input");

  assertEquals(capturedContext.capability, "identity.resolve");
  assertEquals(typeof capturedContext.metadata.timestamp, "number");
});
