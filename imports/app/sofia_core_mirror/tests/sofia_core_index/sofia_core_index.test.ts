import * as index from "../../src/sofia_core_index";

describe("sofia_core_index", () => {
  test("exports all engines", () => {
    expect(index.engines).toBeDefined();
    expect(index.engines.deviation_engine).toBeDefined();
    expect(index.engines.membrane_engine).toBeDefined();
    expect(index.engines.tonal_engine).toBeDefined();
    expect(index.engines.identity_filter).toBeDefined();
  });

  test("exports bridge triad modules", () => {
    expect(index.engines.continuum_filter).toBeDefined();
    expect(index.engines.signature_modulator).toBeDefined();
    expect(index.engines.identity_bridge).toBeDefined();
  });

  test("exports pipeline function", () => {
    expect(typeof index.pipeline).toBe("function");
  });

  test("exports API handler", () => {
    expect(typeof index.api).toBe("function");
  });

  test("includes version metadata", () => {
    expect(index.metadata).toBeDefined();
    expect(typeof index.metadata.version).toBe("string");
    expect(typeof index.metadata.maintainer).toBe("string");
  });
});
