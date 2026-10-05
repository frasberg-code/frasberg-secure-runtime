import { runPipeline } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_pipeline.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Pipeline passes data through steps correctly", async () => {
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      return {
        success: true,
        output: `${input}→${capability}`,
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

  const result = await runPipeline(mockRuntime, pipeline, "start");

  assertEquals(result.success, true);
  assertEquals(
    result.output,
    "start→identity.resolve→deviation.compute→tone.generate"
  );
});

Deno.test("Pipeline handles data transformations", async () => {
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      return {
        success: true,
        output: { value: input.value * 2, capability },
        engineId: "test",
        capability
      };
    }
  };

  const pipeline = [
    {
      capability: "identity.resolve",
      transform: (data: any) => ({ value: data })
    },
    {
      capability: "deviation.compute",
      transform: (data: any) => ({ value: data.value + 10 })
    }
  ];

  const result = await runPipeline(mockRuntime, pipeline, 5);

  assertEquals(result.success, true);
  assertEquals(result.output.value, 30); // (5 * 2 + 10) * 2
});
