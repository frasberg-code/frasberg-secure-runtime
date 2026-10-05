import { identityBridge } from "../../src/identity_bridge";

describe("identity_bridge", () => {
  describe("create", () => {
    test("creates identity with default values", () => {
      const identity = identityBridge.create("sofia-001", "core");
      
      expect(identity.id).toBe("sofia-001");
      expect(identity.domain).toBe("core");
      expect(identity.coherence).toBe(1.0);
      expect(identity.bridged).toBe(false);
    });
  });

  describe("bridge", () => {
    test("successfully bridges to new domain with coherence maintenance", () => {
      const identity = identityBridge.create("sofia-001", "core");
      const result = identityBridge.bridge({
        identity,
        targetDomain: "external",
        maintainCoherence: true
      });
      
      expect(result.success).toBe(true);
      expect(result.identity.domain).toBe("external");
      expect(result.identity.bridged).toBe(true);
      expect(result.identity.coherence).toBeLessThan(1.0);
      expect(result.identity.coherence).toBeGreaterThan(0.5);
      expect(result.coherenceLoss).toBeGreaterThan(0);
    });

    test("bridges to new domain without coherence maintenance", () => {
      const identity = identityBridge.create("sofia-001", "core");
      const result = identityBridge.bridge({
        identity,
        targetDomain: "external",
        maintainCoherence: false
      });
      
      expect(result.success).toBe(true);
      expect(result.coherenceLoss).toBeGreaterThan(0.05);
    });

    test("fails when coherence drops below minimum threshold", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.4,
        bridged: false
      };
      const result = identityBridge.bridge({
        identity,
        targetDomain: "external",
        maintainCoherence: false
      });
      
      expect(result.success).toBe(false);
      expect(result.identity.coherence).toBeLessThan(0.5);
    });

    test("has no coherence loss when bridging to same domain", () => {
      const identity = identityBridge.create("sofia-001", "core");
      const result = identityBridge.bridge({
        identity,
        targetDomain: "core",
        maintainCoherence: true
      });
      
      expect(result.success).toBe(true);
      expect(result.coherenceLoss).toBe(0);
      expect(result.identity.coherence).toBe(1.0);
    });
  });

  describe("crossBoundary", () => {
    test("crosses boundary between domains", () => {
      const identity = identityBridge.create("sofia-001", "core");
      const result = identityBridge.crossBoundary(identity, "external");
      
      expect(result.crossed).toBe(true);
      expect(result.fromDomain).toBe("core");
      expect(result.toDomain).toBe("external");
      expect(result.identity.domain).toBe("external");
      expect(result.identity.bridged).toBe(true);
    });

    test("fails to cross when coherence too low", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.4,
        bridged: false
      };
      const result = identityBridge.crossBoundary(identity, "external");
      
      expect(result.crossed).toBe(false);
    });
  });

  describe("verifyCoherence", () => {
    test("returns true when coherence meets threshold", () => {
      const identity = identityBridge.create("sofia-001", "core");
      
      expect(identityBridge.verifyCoherence(identity)).toBe(true);
    });

    test("returns false when coherence below threshold", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.5,
        bridged: true
      };
      
      expect(identityBridge.verifyCoherence(identity)).toBe(false);
    });

    test("respects custom threshold", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.6,
        bridged: true
      };
      
      expect(identityBridge.verifyCoherence(identity, 0.5)).toBe(true);
      expect(identityBridge.verifyCoherence(identity, 0.7)).toBe(false);
    });
  });

  describe("restore", () => {
    test("restores coherence with default amount", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.6,
        bridged: true
      };
      const restored = identityBridge.restore(identity);
      
      expect(restored.coherence).toBeCloseTo(0.8, 1);
    });

    test("restores coherence with custom amount", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.5,
        bridged: true
      };
      const restored = identityBridge.restore(identity, 0.4);
      
      expect(restored.coherence).toBeCloseTo(0.9, 1);
    });

    test("clamps coherence to maximum of 1.0", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.95,
        bridged: true
      };
      const restored = identityBridge.restore(identity, 0.3);
      
      expect(restored.coherence).toBe(1.0);
    });
  });

  describe("anchor", () => {
    test("anchors identity to domain", () => {
      const identity = {
        id: "sofia-001",
        domain: "external",
        coherence: 0.8,
        bridged: true
      };
      const anchored = identityBridge.anchor(identity, "core");
      
      expect(anchored.domain).toBe("core");
      expect(anchored.bridged).toBe(false);
      expect(anchored.coherence).toBeGreaterThan(0.8);
    });

    test("improves coherence when anchoring", () => {
      const identity = {
        id: "sofia-001",
        domain: "external",
        coherence: 0.7,
        bridged: true
      };
      const anchored = identityBridge.anchor(identity, "stable");
      
      expect(anchored.coherence).toBeCloseTo(0.8, 1);
    });

    test("does not exceed maximum coherence", () => {
      const identity = {
        id: "sofia-001",
        domain: "external",
        coherence: 0.95,
        bridged: true
      };
      const anchored = identityBridge.anchor(identity, "core");
      
      expect(anchored.coherence).toBe(1.0);
    });
  });

  describe("canBridge", () => {
    test("returns true when bridging is possible", () => {
      const identity = identityBridge.create("sofia-001", "core");
      
      expect(identityBridge.canBridge(identity, "external")).toBe(true);
    });

    test("returns false when coherence would drop too low", () => {
      const identity = {
        id: "sofia-001",
        domain: "core",
        coherence: 0.5,
        bridged: false
      };
      
      expect(identityBridge.canBridge(identity, "external", 0.6)).toBe(false);
    });

    test("respects minimum coherence parameter", () => {
      const identity = identityBridge.create("sofia-001", "core");
      
      expect(identityBridge.canBridge(identity, "external", 0.8)).toBe(true);
      expect(identityBridge.canBridge(identity, "external", 0.99)).toBe(false);
    });
  });
});
