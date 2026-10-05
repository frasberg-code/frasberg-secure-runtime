import { ConstitutionalDashboardService, DashboardServiceContext } from "./ConstitutionalDashboardService";
import { KernelMode } from "./ConstitutionalDashboardTypes";

describe("ConstitutionalDashboardService", () => {
  let service: ConstitutionalDashboardService;
  let mockContext: DashboardServiceContext;

  beforeEach(() => {
    mockContext = {
      kernel: {
        safetySnapshotProvider: () => ({
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
        }),
        modeManager: {
          getMode: () => "steady_state" as KernelMode,
          allowedTransitions: () => ["self_governing", "evolution"],
          lastTransitionTime: new Date().toISOString(),
        },
        recentTelemetry: [],
      },
      memory: {
        query: () => [],
        recent: () => [],
      },
    };

    service = new ConstitutionalDashboardService(mockContext);
  });

  describe("getState", () => {
    it("should generate dashboard state", () => {
      const state = service.getState();

      expect(state.timestamp).toBeDefined();
      expect(state.safetyEnvelope).toBeDefined();
      expect(state.mode).toBeDefined();
      expect(state.sovereignStats).toBeDefined();
      expect(state.corridorHealth).toBeInstanceOf(Array);
      expect(state.metrics).toBeDefined();
      expect(state.systemScore).toBeGreaterThanOrEqual(0);
      expect(state.systemScore).toBeLessThanOrEqual(100);
    });

    it("should reflect safety envelope status", () => {
      const state = service.getState();

      expect(state.safetyEnvelope.slaOk).toBe(true);
      expect(state.safetyEnvelope.sovereigntyOk).toBe(true);
      expect(state.safetyEnvelope.overallHealthy).toBe(true);
    });

    it("should show current kernel mode", () => {
      const state = service.getState();

      expect(state.mode.currentMode).toBe("steady_state");
      expect(state.mode.allowedTransitions).toContain("evolution");
    });

    it("should cache dashboard state", () => {
      const state1 = service.getState();
      const state2 = service.getState();

      expect(state1).toBe(state2);
    });

    it("should count sovereign violations", () => {
      mockContext.memory.query = (type: string) => {
        if (type === "SOVEREIGN_VIOLATION") {
          return [
            { id: "v1", type: "SOVEREIGN_VIOLATION", payload: { type: "residency" } },
            { id: "v2", type: "SOVEREIGN_VIOLATION", payload: { type: "corridor" } },
          ];
        }
        return [];
      };

      const state = service.getState();

      expect(state.sovereignStats.residencyViolations).toBeGreaterThan(0);
    });

    it("should track active overrides", () => {
      mockContext.memory.query = (type: string) => {
        if (type === "OVERRIDE") {
          return [
            { id: "o1", type: "OVERRIDE" },
            { id: "o2", type: "OVERRIDE" },
            { id: "o3", type: "OVERRIDE" },
          ];
        }
        return [];
      };

      const state = service.getState();

      expect(state.sovereignStats.overridesActive).toBe(3);
    });

    it("should include SIE insights and recommendations", () => {
      mockContext.kernel.runSIE = () => ({
        insights: [
          {
            id: "insight-1",
            timestamp: new Date().toISOString(),
            category: "OVERRIDE_PRESSURE",
            severity: "HIGH",
            message: "High override pressure",
            details: {},
          },
        ],
        recommendations: [
          {
            id: "rec-1",
            timestamp: new Date().toISOString(),
            kind: "REDUCE_OVERRIDES",
            rationale: "Too many overrides",
            suggestedChanges: {},
          },
        ],
      });

      const state = service.getState();

      expect(state.insights.length).toBeGreaterThan(0);
      expect(state.recommendations.length).toBeGreaterThan(0);
    });

    it("should calculate system score based on health", () => {
      const healthyState = service.getState();
      expect(healthyState.systemScore).toBeGreaterThan(80);

      // Make it unhealthy
      mockContext.kernel.safetySnapshotProvider = () => ({
        slaOk: false,
        latencyOk: false,
        complianceOk: false,
        sovereigntyOk: false,
        meshOk: false,
        evolutionOk: false,
      });

      service.invalidateCache();
      const unhealthyState = service.getState();
      expect(unhealthyState.systemScore).toBeLessThan(healthyState.systemScore);
    });
  });

  describe("cache invalidation", () => {
    it("should invalidate cache", () => {
      const state1 = service.getState();
      service.invalidateCache();
      const state2 = service.getState();

      expect(state1).not.toBe(state2);
      expect(state1.timestamp).not.toBe(state2.timestamp);
    });
  });
});
