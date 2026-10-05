import { deviationEngine } from "../../src/deviation_engine";

describe("deviation_engine", () => {
  test("initializes and returns expected state", () => {
    const state = deviationEngine.initialize();
    expect(state).toBeDefined();
    expect(state.baseline).toBe(0);
    expect(state.deviation).toBe(0);
    expect(state.stability).toBe(1.0);
  });
  
  test("updates state with delta input", () => {
    const state = deviationEngine.initialize();
    const result = deviationEngine.update(state, { delta: 10 });
    expect(result).toBeDefined();
    expect(result.deviation).toBe(10);
  });
});
