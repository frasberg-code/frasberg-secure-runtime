import { membraneEngine } from "../../src/membrane_engine";

describe("membrane_engine", () => {
  test("initializes with default membrane pressure", () => {
    const state = membraneEngine.initialize();
    expect(state.pressure).toBeDefined();
  });

  test("applies pressure update without breaking symmetry", () => {
    const state = membraneEngine.initialize();
    const updated = membraneEngine.update(state, { delta: 1 });

    expect(updated.symmetry).toBe(state.symmetry);
    expect(updated.pressure).not.toBe(state.pressure);
  });

  test("maintains loop integrity after multiple updates", () => {
    let state = membraneEngine.initialize();

    for (let i = 0; i < 5; i++) {
      state = membraneEngine.update(state, { delta: 0.5 });
    }

    expect(state.loopIntegrity).toBe(true);
  });
});
