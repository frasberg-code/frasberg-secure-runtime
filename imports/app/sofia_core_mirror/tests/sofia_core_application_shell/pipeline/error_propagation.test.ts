import { runPipeline } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_pipeline.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Pipeline captures capability errors", async () => {
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      if (capability === "membrane.filter") {
        return {
          success: false,
          error: "Filter validation failed",
          engineId: "membrane_engine",
          capability
        };
      }
      
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
    "membrane.filter",
    "tone.generate"
  ];

  const result = await runPipeline(mockRuntime, pipeline, "input");

  assertEquals(result.success, false);
  assertEquals(result.error, "Filter validation failed");
  assertEquals(result.failedStep, "membrane.filter");
  assertEquals(result.executedSteps?.length, 3);
});

Deno.test("Pipeline handles exceptions gracefully", async () => {
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      if (capability === "deviation.compute") {
        throw new Error("Unexpected computation error");
      }
      
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
    "membrane.filter"
  ];

  const result = await runPipeline(mockRuntime, pipeline, "input");

  assertEquals(result.success, false);
  assertEquals(result.error, "Unexpected computation error");
  assertEquals(result.failedStep, "deviation.compute");
});
