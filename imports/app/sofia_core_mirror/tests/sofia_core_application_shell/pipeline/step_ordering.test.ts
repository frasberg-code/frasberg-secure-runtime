import { runPipeline } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_pipeline.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Pipeline executes steps in correct order", async () => {
  const executionOrder: string[] = [];
  
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      executionOrder.push(capability);
      return {
        success: true,
        output: `${input}-${capability}`,
        engineId: "test",
        capability
      };
    }
  };

  const pipeline = [
    "identity.resolve",
    "deviation.compute",
    "membrane.filter",
    "tone.generate",
    "api.compose"
  ];

  const result = await runPipeline(mockRuntime, pipeline, "input");

  assertEquals(result.success, true);
  assertEquals(executionOrder, pipeline);
  assertEquals(result.executedSteps, pipeline);
});

Deno.test("Pipeline stops at first failure", async () => {
  const executionOrder: string[] = [];
  
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      executionOrder.push(capability);
      
      if (capability === "deviation.compute") {
        return {
          success: false,
          error: "Computation failed",
          engineId: "test",
          capability
        };
      }
      
      return {
        success: true,
        output: `${input}-${capability}`,
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
  assertEquals(result.failedStep, "deviation.compute");
  assertEquals(executionOrder, ["identity.resolve", "deviation.compute"]);
  assertEquals(result.executedSteps, ["identity.resolve", "deviation.compute"]);
});
