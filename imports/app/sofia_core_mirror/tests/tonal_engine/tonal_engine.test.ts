import { tonalEngine } from "../../src/tonal_engine";

describe("tonal_engine", () => {
  test("detects key from simple note set", () => {
    const result = tonalEngine.detectKey(["C", "E", "G"]);
    expect(result.key).toBe("C");
  });

  test("generates scale degrees for a given key", () => {
    const degrees = tonalEngine.scaleDegrees("A minor");
    expect(degrees).toContain("i");
    expect(degrees).toContain("iv");
    expect(degrees).toContain("v");
  });

  test("transposes notes correctly", () => {
    const output = tonalEngine.transpose(["C", "D", "E"], 2);
    expect(output).toEqual(["D", "E", "F#"]);
  });

  test("validates interval relationships", () => {
    const interval = tonalEngine.interval("C", "G");
    expect(interval).toBe("P5");
  });

  test("maintains mode integrity", () => {
    const mode = tonalEngine.mode("D Dorian");
    expect(mode.root).toBe("D");
    expect(mode.type).toBe("Dorian");
  });
});
