import { signatureModulator } from "../../src/signature_modulator";

describe("signature_modulator", () => {
  describe("create", () => {
    test("creates signature with default values", () => {
      const signature = signatureModulator.create("Sofia");
      
      expect(signature.base).toBe("Sofia");
      expect(signature.modulation).toBe(0.0);
      expect(signature.coherence).toBe(1.0);
    });
  });

  describe("modulate", () => {
    test("modulates toward target in adaptive mode", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.modulate({
        signature,
        target: 0.5,
        adaptive: true
      });
      
      expect(result.signature.modulation).toBeGreaterThan(0);
      expect(result.signature.modulation).toBeLessThanOrEqual(0.2);
      expect(result.converged).toBe(false);
      expect(result.delta).toBeGreaterThan(0);
    });

    test("modulates toward target in non-adaptive mode", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.modulate({
        signature,
        target: 0.5,
        adaptive: false
      });
      
      expect(result.signature.modulation).toBeGreaterThan(0);
      expect(result.signature.modulation).toBeLessThanOrEqual(0.1);
    });

    test("converges when close to target", () => {
      const signature = {
        base: "Sofia",
        modulation: 0.495,
        coherence: 0.9
      };
      const result = signatureModulator.modulate({
        signature,
        target: 0.5,
        adaptive: true
      });
      
      expect(result.converged).toBe(true);
    });

    test("adjusts coherence based on modulation magnitude", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.modulate({
        signature,
        target: 0.8,
        adaptive: true
      });
      
      expect(result.signature.coherence).toBeLessThan(1.0);
      expect(result.signature.coherence).toBeGreaterThanOrEqual(0.5);
    });

    test("modulates negatively toward lower target", () => {
      const signature = {
        base: "Sofia",
        modulation: 0.5,
        coherence: 0.9
      };
      const result = signatureModulator.modulate({
        signature,
        target: 0.0,
        adaptive: true
      });
      
      expect(result.signature.modulation).toBeLessThan(0.5);
      expect(result.delta).toBeLessThan(0);
    });
  });

  describe("shape", () => {
    test("shapes signature based on context", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.shape(signature, "This is a long context string that will influence the shaping");
      
      expect(result.signature.modulation).toBeGreaterThan(0);
      expect(result.fidelity).toBeLessThan(1.0);
    });

    test("marks as shaped when shaping amount is significant", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.shape(
        signature,
        "A moderately long context string to test shaping"
      );
      
      expect(result.shaped).toBe(true);
    });

    test("does not shape significantly for short context", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.shape(signature, "short");
      
      expect(result.shaped).toBe(false);
    });

    test("adjusts coherence based on fidelity", () => {
      const signature = signatureModulator.create("Sofia");
      const result = signatureModulator.shape(
        signature,
        "A context string that influences coherence"
      );
      
      expect(result.signature.coherence).toBeLessThan(signature.coherence);
    });
  });

  describe("verifyCoherence", () => {
    test("returns true when coherence meets threshold", () => {
      const signature = {
        base: "Sofia",
        modulation: 0.3,
        coherence: 0.8
      };
      
      expect(signatureModulator.verifyCoherence(signature)).toBe(true);
    });

    test("returns false when coherence below threshold", () => {
      const signature = {
        base: "Sofia",
        modulation: 0.5,
        coherence: 0.5
      };
      
      expect(signatureModulator.verifyCoherence(signature)).toBe(false);
    });

    test("respects custom threshold", () => {
      const signature = {
        base: "Sofia",
        modulation: 0.2,
        coherence: 0.6
      };
      
      expect(signatureModulator.verifyCoherence(signature, 0.5)).toBe(true);
      expect(signatureModulator.verifyCoherence(signature, 0.7)).toBe(false);
    });
  });

  describe("reset", () => {
    test("resets signature to base state", () => {
      const signature = {
        base: "Sofia",
        modulation: 0.5,
        coherence: 0.7
      };
      const reset = signatureModulator.reset(signature);
      
      expect(reset.base).toBe("Sofia");
      expect(reset.modulation).toBe(0.0);
      expect(reset.coherence).toBe(1.0);
    });
  });

  describe("blend", () => {
    test("blends two signatures with default ratio", () => {
      const sig1 = {
        base: "Sofia",
        modulation: 0.2,
        coherence: 0.9
      };
      const sig2 = {
        base: "Assistant",
        modulation: 0.8,
        coherence: 0.7
      };
      const blended = signatureModulator.blend(sig1, sig2);
      
      expect(blended.base).toBe("Sofia");
      expect(blended.modulation).toBeCloseTo(0.5, 1);
      expect(blended.coherence).toBeCloseTo(0.8, 1);
    });

    test("blends with custom ratio", () => {
      const sig1 = {
        base: "Sofia",
        modulation: 0.0,
        coherence: 1.0
      };
      const sig2 = {
        base: "Assistant",
        modulation: 1.0,
        coherence: 0.5
      };
      const blended = signatureModulator.blend(sig1, sig2, 0.3);
      
      expect(blended.modulation).toBeCloseTo(0.3, 1);
      expect(blended.coherence).toBeCloseTo(0.85, 1);
    });

    test("clamps ratio to valid range", () => {
      const sig1 = {
        base: "Sofia",
        modulation: 0.0,
        coherence: 1.0
      };
      const sig2 = {
        base: "Assistant",
        modulation: 1.0,
        coherence: 0.5
      };
      
      const blendedHigh = signatureModulator.blend(sig1, sig2, 1.5);
      expect(blendedHigh.modulation).toBeCloseTo(1.0, 1);
      
      const blendedLow = signatureModulator.blend(sig1, sig2, -0.5);
      expect(blendedLow.modulation).toBeCloseTo(0.0, 1);
    });
  });
});
