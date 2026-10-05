import { continuumFilter } from "../../src/continuum_filter";

describe("continuum_filter", () => {
  describe("initialization", () => {
    test("initializes with default continuum state", () => {
      const state = continuumFilter.initialize();
      
      expect(state.continuity).toBe(1.0);
      expect(state.stability).toBe(1.0);
      expect(state.gateOpen).toBe(true);
    });
  });

  describe("gate", () => {
    test("allows passage when continuity meets threshold", () => {
      const state = continuumFilter.initialize();
      const result = continuumFilter.gate({ state, threshold: 0.8 });
      
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe("passed");
      expect(result.continuity).toBe(1.0);
    });

    test("denies passage when continuity below threshold", () => {
      const state = {
        continuity: 0.5,
        stability: 0.8,
        gateOpen: true
      };
      const result = continuumFilter.gate({ state, threshold: 0.8 });
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("low_continuity");
    });

    test("denies passage when gate is closed", () => {
      const state = {
        continuity: 1.0,
        stability: 1.0,
        gateOpen: false
      };
      const result = continuumFilter.gate({ state, threshold: 0.5 });
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("gate_closed");
    });
  });

  describe("refine", () => {
    test("adjusts continuity with positive adjustment", () => {
      const state = continuumFilter.initialize();
      const refined = continuumFilter.refine(state, -0.2);
      
      expect(refined.continuity).toBe(0.8);
      expect(refined.stability).toBeCloseTo(0.9, 1);
    });

    test("clamps continuity to valid range [0, 1]", () => {
      const state = { continuity: 0.1, stability: 0.5, gateOpen: true };
      const refined = continuumFilter.refine(state, -0.5);
      
      expect(refined.continuity).toBe(0);
      expect(refined.stability).toBeGreaterThanOrEqual(0);
    });

    test("adjusts stability proportionally", () => {
      const state = continuumFilter.initialize();
      const refined = continuumFilter.refine(state, 0.2);
      
      expect(refined.continuity).toBe(1.0);
      expect(refined.stability).toBe(1.0);
    });
  });

  describe("setGate", () => {
    test("opens the gate", () => {
      const state = { continuity: 1.0, stability: 1.0, gateOpen: false };
      const updated = continuumFilter.setGate(state, true);
      
      expect(updated.gateOpen).toBe(true);
    });

    test("closes the gate", () => {
      const state = continuumFilter.initialize();
      const updated = continuumFilter.setGate(state, false);
      
      expect(updated.gateOpen).toBe(false);
    });
  });

  describe("isStable", () => {
    test("returns true when stability meets threshold", () => {
      const state = { continuity: 0.5, stability: 0.9, gateOpen: true };
      
      expect(continuumFilter.isStable(state)).toBe(true);
    });

    test("returns false when stability below threshold", () => {
      const state = { continuity: 1.0, stability: 0.5, gateOpen: true };
      
      expect(continuumFilter.isStable(state)).toBe(false);
    });

    test("respects custom stability threshold", () => {
      const state = { continuity: 1.0, stability: 0.7, gateOpen: true };
      
      expect(continuumFilter.isStable(state, 0.6)).toBe(true);
      expect(continuumFilter.isStable(state, 0.8)).toBe(false);
    });
  });

  describe("merge", () => {
    test("averages continuity and stability from two states", () => {
      const state1 = { continuity: 0.8, stability: 0.9, gateOpen: true };
      const state2 = { continuity: 0.6, stability: 0.7, gateOpen: true };
      const merged = continuumFilter.merge(state1, state2);
      
      expect(merged.continuity).toBe(0.7);
      expect(merged.stability).toBe(0.8);
    });

    test("requires both gates open for merged gate to be open", () => {
      const state1 = { continuity: 1.0, stability: 1.0, gateOpen: true };
      const state2 = { continuity: 1.0, stability: 1.0, gateOpen: false };
      const merged = continuumFilter.merge(state1, state2);
      
      expect(merged.gateOpen).toBe(false);
    });

    test("keeps gate open when both states have open gates", () => {
      const state1 = { continuity: 0.8, stability: 0.8, gateOpen: true };
      const state2 = { continuity: 0.9, stability: 0.9, gateOpen: true };
      const merged = continuumFilter.merge(state1, state2);
      
      expect(merged.gateOpen).toBe(true);
    });
  });
});
