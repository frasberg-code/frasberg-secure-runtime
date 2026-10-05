import { SovereignIntelligenceEngine, SieInputSnapshot } from "./SovereignIntelligenceEngine";

describe("SovereignIntelligenceEngine", () => {
  let engine: SovereignIntelligenceEngine;

  beforeEach(() => {
    engine = new SovereignIntelligenceEngine();
  });

  describe("analyze", () => {
    it("should detect sovereign risk", () => {
      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: false,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: [],
      };

      const output = engine.analyze(input);

      expect(output.insights.length).toBeGreaterThan(0);
      const sovereignInsight = output.insights.find(
        (i) => i.category === "SOVEREIGN_RISK"
      );
      expect(sovereignInsight).toBeDefined();
      expect(sovereignInsight?.severity).toBe("HIGH");
    });

    it("should detect compliance risk", () => {
      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: false,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: [],
      };

      const output = engine.analyze(input);

      const complianceInsight = output.insights.find(
        (i) => i.category === "COMPLIANCE_RISK"
      );
      expect(complianceInsight).toBeDefined();
      expect(complianceInsight?.severity).toBe("CRITICAL");
    });

    it("should detect override pressure", () => {
      const overrides = Array.from({ length: 25 }, (_, i) => ({
        id: `override-${i}`,
        timestamp: new Date().toISOString(),
        type: "OVERRIDE",
        payload: {},
      }));

      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: overrides,
      };

      const output = engine.analyze(input);

      const overrideInsight = output.insights.find(
        (i) => i.category === "OVERRIDE_PRESSURE"
      );
      expect(overrideInsight).toBeDefined();
      expect(overrideInsight?.severity).toBe("HIGH");
    });

    it("should detect mesh imbalance", () => {
      const meshEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `mesh-${i}`,
        timestamp: new Date().toISOString(),
        type: "MESH",
        eventType: "IMBALANCE",
        details: { imbalanceScore: 0.8 },
      }));

      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: meshEvents,
        memorySnapshot: [],
      };

      const output = engine.analyze(input);

      const meshInsight = output.insights.find(
        (i) => i.category === "MESH_RISK"
      );
      expect(meshInsight).toBeDefined();
    });

    it("should detect evolution blocks", () => {
      const evolutionBlocks = Array.from({ length: 10 }, (_, i) => ({
        id: `evolution-${i}`,
        timestamp: new Date().toISOString(),
        type: "EVOLUTION_OUTCOME",
        payload: { blocked: true },
      }));

      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: evolutionBlocks,
      };

      const output = engine.analyze(input);

      const evolutionInsight = output.insights.find(
        (i) => i.category === "EVOLUTION_RISK"
      );
      expect(evolutionInsight).toBeDefined();
    });

    it("should generate recommendations for risks", () => {
      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: false,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: [],
      };

      const output = engine.analyze(input);

      expect(output.recommendations.length).toBeGreaterThan(0);
      const residencyRec = output.recommendations.find(
        (r) => r.kind === "TIGHTEN_RESIDENCY"
      );
      expect(residencyRec).toBeDefined();
    });

    it("should handle healthy system state", () => {
      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: [],
      };

      const output = engine.analyze(input);

      expect(output.insights.length).toBe(0);
      expect(output.recommendations.length).toBe(0);
    });

    it("should detect critical override pressure", () => {
      const criticalOverrides = Array.from({ length: 40 }, (_, i) => ({
        id: `override-${i}`,
        timestamp: new Date().toISOString(),
        type: "OVERRIDE",
        payload: {},
      }));

      const input: SieInputSnapshot = {
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        },
        telemetryEvents: [],
        memorySnapshot: criticalOverrides,
      };

      const output = engine.analyze(input);

      const criticalInsight = output.insights.find(
        (i) => i.category === "OVERRIDE_PRESSURE" && i.severity === "CRITICAL"
      );
      expect(criticalInsight).toBeDefined();
    });
  });
});
