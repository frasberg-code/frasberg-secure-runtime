import { runPipeline, createPipeline, validatePipeline } from "../../../supabase/frasberg_ai/frasberg_ai_application_shell/app_shell_pipeline.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("Pipeline returns final output from last step", async () => {
  const mockRuntime = {
    call: async (capability: string, input: any) => {
      if (capability === "api.compose") {
        return {
          success: true,
          output: {
            status: 200,
            body: { result: input },
            headers: { "Content-Type": "application/json" }
          },
          engineId: "frasberg_api",
          capability
        };
      }
      
      return {
        success: true,
        output: `processed-${input}`,
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

  const result = await runPipeline(mockRuntime, pipeline, "user-input");

  assertEquals(result.success, true);
  assertEquals(result.output.status, 200);
  assertEquals(result.output.headers["Content-Type"], "application/json");
  assertEquals(typeof result.output.body, "object");
});

Deno.test("createPipeline generates reusable pipeline", async () => {
  const mockRuntime = {
    call: async (capability: string, input: any) => ({
      success: true,
      output: `${input}-${capability}`,
      engineId: "test",
      capability
    })
  };

  const frasbergPipeline = createPipeline([
    "identity.resolve",
    "deviation.compute",
    "tone.generate",
    "api.compose"
  ]);

  const result1 = await frasbergPipeline(mockRuntime, "request1");
  const result2 = await frasbergPipeline(mockRuntime, "request2");

  assertEquals(result1.success, true);
  assertEquals(result2.success, true);
  assertEquals(result1.output?.includes("request1"), true);
  assertEquals(result2.output?.includes("request2"), true);
});

Deno.test("validatePipeline checks capability availability", () => {
  const mockRuntime = {
    hasCapability: (cap: string) => {
      return [
        "identity.resolve",
        "deviation.compute",
        "membrane.filter"
      ].includes(cap);
    }
  };

  const validPipeline = [
    "identity.resolve",
    "deviation.compute",
    "membrane.filter"
  ];

  const invalidPipeline = [
    "identity.resolve",
    "unknown.capability",
    "membrane.filter"
  ];

  const validResult = validatePipeline(mockRuntime, validPipeline);
  const invalidResult = validatePipeline(mockRuntime, invalidPipeline);

  assertEquals(validResult.valid, true);
  assertEquals(validResult.missingCapabilities.length, 0);

  assertEquals(invalidResult.valid, false);
  assertEquals(invalidResult.missingCapabilities, ["unknown.capability"]);
});
