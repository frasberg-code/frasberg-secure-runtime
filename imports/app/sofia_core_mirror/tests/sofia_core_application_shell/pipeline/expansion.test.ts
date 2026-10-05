/**
 * Pipeline Expansion Tests
 * 
 * Validates automatic dependency resolution and pipeline expansion.
 */

import { expandPipeline } from "../../../supabase/sofia_core/sofia_core_application_shell/app_shell_pipeline.ts";

Deno.test("expandPipeline includes all dependencies in correct order", () => {
  // Mock runtime with capability graph
  const runtime = {
    getCapabilityGraph: () => ({
      identity_filter: {
        provides: ["identity.resolve", "identity.normalize"],
        consumes: []
      },
      deviation_engine: {
        provides: ["deviation.compute", "deviation.analyze"],
        consumes: ["identity.resolve"]
      },
      membrane_engine: {
        provides: ["membrane.filter", "membrane.transform"],
        consumes: ["identity.resolve", "deviation.compute"]
      },
      tonal_engine: {
        provides: ["tone.generate", "tone.adjust"],
        consumes: ["identity.normalize", "membrane.filter"]
      },
      sofia_api: {
        provides: ["api.respond", "api.compose"],
        consumes: ["tone.generate", "membrane.transform", "identity.resolve"]
      }
    })
  };

  // Test: Simple capability with dependencies
  const expanded = expandPipeline(runtime, ["tone.generate"]);

  // Verify all dependencies are included
  if (!expanded.includes("identity.resolve")) {
    throw new Error("Missing dependency: identity.resolve");
  }
  if (!expanded.includes("identity.normalize")) {
    throw new Error("Missing dependency: identity.normalize");
  }
  if (!expanded.includes("deviation.compute")) {
    throw new Error("Missing dependency: deviation.compute");
  }
  if (!expanded.includes("membrane.filter")) {
    throw new Error("Missing dependency: membrane.filter");
  }
  if (!expanded.includes("tone.generate")) {
    throw new Error("Missing target capability: tone.generate");
  }

  // Verify dependencies come before dependents
  const resolveIdx = expanded.indexOf("identity.resolve");
  const normalizeIdx = expanded.indexOf("identity.normalize");
  const deviationIdx = expanded.indexOf("deviation.compute");
  const membraneIdx = expanded.indexOf("membrane.filter");
  const toneIdx = expanded.indexOf("tone.generate");

  if (deviationIdx < resolveIdx) {
    throw new Error("Dependency order violation: deviation.compute before identity.resolve");
  }
  if (membraneIdx < resolveIdx || membraneIdx < deviationIdx) {
    throw new Error("Dependency order violation: membrane.filter before its dependencies");
  }
  if (toneIdx < normalizeIdx || toneIdx < membraneIdx) {
    throw new Error("Dependency order violation: tone.generate before its dependencies");
  }
});

Deno.test("expandPipeline handles multiple steps", () => {
  const runtime = {
    getCapabilityGraph: () => ({
      identity_filter: {
        provides: ["identity.resolve", "identity.normalize"],
        consumes: []
      },
      deviation_engine: {
        provides: ["deviation.compute", "deviation.analyze"],
        consumes: ["identity.resolve"]
      },
      membrane_engine: {
        provides: ["membrane.filter", "membrane.transform"],
        consumes: ["identity.resolve", "deviation.compute"]
      }
    })
  };

  const expanded = expandPipeline(runtime, ["deviation.compute", "membrane.filter"]);

  // Should include identity.resolve (dependency of both)
  if (!expanded.includes("identity.resolve")) {
    throw new Error("Missing shared dependency: identity.resolve");
  }

  // Should not duplicate capabilities
  const resolveCount = expanded.filter(c => c === "identity.resolve").length;
  if (resolveCount !== 1) {
    throw new Error(`identity.resolve appears ${resolveCount} times, should appear once`);
  }

  // Should maintain order
  const resolveIdx = expanded.indexOf("identity.resolve");
  const deviationIdx = expanded.indexOf("deviation.compute");
  const membraneIdx = expanded.indexOf("membrane.filter");

  if (deviationIdx < resolveIdx) {
    throw new Error("Dependency order violation");
  }
  if (membraneIdx < resolveIdx || membraneIdx < deviationIdx) {
    throw new Error("Dependency order violation for membrane.filter");
  }
});

Deno.test("expandPipeline throws error for missing provider", () => {
  const runtime = {
    getCapabilityGraph: () => ({
      identity_filter: {
        provides: ["identity.resolve"],
        consumes: []
      }
    })
  };

  let errorThrown = false;
  try {
    expandPipeline(runtime, ["nonexistent.capability"]);
  } catch (error) {
    errorThrown = true;
    if (!error.message.includes("No provider")) {
      throw new Error("Wrong error message");
    }
  }

  if (!errorThrown) {
    throw new Error("Should have thrown error for missing provider");
  }
});

Deno.test("expandPipeline handles capability with no dependencies", () => {
  const runtime = {
    getCapabilityGraph: () => ({
      identity_filter: {
        provides: ["identity.resolve", "identity.normalize"],
        consumes: []
      }
    })
  };

  const expanded = expandPipeline(runtime, ["identity.resolve"]);

  // Should only include the requested capability
  if (expanded.length !== 1) {
    throw new Error(`Expected 1 capability, got ${expanded.length}`);
  }
  if (expanded[0] !== "identity.resolve") {
    throw new Error("Should return only the requested capability");
  }
});

Deno.test("expandPipeline produces complete dependency-sound pipeline", () => {
  const runtime = {
    getCapabilityGraph: () => ({
      identity_filter: {
        provides: ["identity.resolve", "identity.normalize"],
        consumes: []
      },
      deviation_engine: {
        provides: ["deviation.compute", "deviation.analyze"],
        consumes: ["identity.resolve"]
      },
      membrane_engine: {
        provides: ["membrane.filter", "membrane.transform"],
        consumes: ["identity.resolve", "deviation.compute"]
      },
      tonal_engine: {
        provides: ["tone.generate", "tone.adjust"],
        consumes: ["identity.normalize", "membrane.filter"]
      },
      sofia_api: {
        provides: ["api.respond", "api.compose"],
        consumes: ["tone.generate", "membrane.transform", "identity.resolve"]
      }
    })
  };

  // Request only the final capability
  const expanded = expandPipeline(runtime, ["api.compose"]);

  // Verify all required capabilities are present
  const requiredCapabilities = [
    "identity.resolve",
    "identity.normalize",
    "deviation.compute",
    "membrane.filter",
    "membrane.transform",
    "tone.generate",
    "api.compose"
  ];

  for (const cap of requiredCapabilities) {
    if (!expanded.includes(cap)) {
      throw new Error(`Missing required capability: ${cap}`);
    }
  }

  // Verify dependency order is maintained
  const indices = Object.fromEntries(
    expanded.map((cap, idx) => [cap, idx])
  );

  // identity capabilities must come first (no dependencies)
  // deviation.compute depends on identity.resolve
  if (indices["deviation.compute"] < indices["identity.resolve"]) {
    throw new Error("Order violation: deviation before identity.resolve");
  }

  // membrane capabilities depend on identity.resolve and deviation.compute
  if (indices["membrane.filter"] < indices["identity.resolve"] ||
      indices["membrane.filter"] < indices["deviation.compute"]) {
    throw new Error("Order violation: membrane.filter before its dependencies");
  }
  if (indices["membrane.transform"] < indices["identity.resolve"] ||
      indices["membrane.transform"] < indices["deviation.compute"]) {
    throw new Error("Order violation: membrane.transform before its dependencies");
  }

  // tone.generate depends on identity.normalize and membrane.filter
  if (indices["tone.generate"] < indices["identity.normalize"] ||
      indices["tone.generate"] < indices["membrane.filter"]) {
    throw new Error("Order violation: tone.generate before its dependencies");
  }

  // api.compose depends on tone.generate, membrane.transform, and identity.resolve
  if (indices["api.compose"] < indices["tone.generate"] ||
      indices["api.compose"] < indices["membrane.transform"] ||
      indices["api.compose"] < indices["identity.resolve"]) {
    throw new Error("Order violation: api.compose before its dependencies");
  }
});
