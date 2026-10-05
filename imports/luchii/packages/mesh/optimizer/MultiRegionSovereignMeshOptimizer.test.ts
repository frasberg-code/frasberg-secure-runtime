import { MultiRegionSovereignMeshOptimizer, RegionMeshState } from "./MultiRegionSovereignMeshOptimizer";

describe("MultiRegionSovereignMeshOptimizer", () => {
  let optimizer: MultiRegionSovereignMeshOptimizer;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      corridorGraph: {
        edges: [
          {
            id: "us-east::us-west",
            fromRegion: "us-east",
            toRegion: "us-west",
            maxLatencyMs: 150,
            health: 0.9,
          },
          {
            id: "us-west::eu-central",
            fromRegion: "us-west",
            toRegion: "eu-central",
            maxLatencyMs: 250,
            health: 0.8,
          },
          {
            id: "eu-central::apac",
            fromRegion: "eu-central",
            toRegion: "apac",
            maxLatencyMs: 300,
            health: 0.7,
          },
        ],
      },
      residencyEngine: {
        canMoveToRegion: () => true,
      },
      healthEngine: {
        score: () => ({ score: 0.8 }),
      },
    };

    optimizer = new MultiRegionSovereignMeshOptimizer(mockContext);
  });

  describe("optimize", () => {
    it("should identify optimization opportunities", () => {
      const states: RegionMeshState[] = [
        {
          regionId: "us-east",
          name: "US East",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 500,
          avgHealthScore: 0.3,
          saturation: 0.9,
        },
        {
          regionId: "us-west",
          name: "US West",
          totalWorkloads: 500,
          sovereignZones: [],
          avgLatencyMs: 100,
          avgHealthScore: 0.9,
          saturation: 0.2,
        },
      ];

      const decisions = optimizer.optimize(states);

      expect(decisions.length).toBeGreaterThan(0);
      expect(decisions[0].fromRegionId).toBe("us-east");
      expect(decisions[0].toRegionId).toBe("us-west");
      expect(decisions[0].workloadsToMove).toBeGreaterThan(0);
    });

    it("should respect health constraints", () => {
      mockContext.corridorGraph.edges[0].health = 0.3; // Unhealthy corridor

      const states: RegionMeshState[] = [
        {
          regionId: "us-east",
          name: "US East",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 500,
          avgHealthScore: 0.3,
          saturation: 0.9,
        },
        {
          regionId: "us-west",
          name: "US West",
          totalWorkloads: 500,
          sovereignZones: [],
          avgLatencyMs: 100,
          avgHealthScore: 0.9,
          saturation: 0.2,
        },
      ];

      const decisions = optimizer.optimize(states);

      // Should not include moves over unhealthy corridors
      const invalidMoves = decisions.filter(
        (d) =>
          d.fromRegionId === "us-east" && d.toRegionId === "us-west"
      );
      expect(invalidMoves.length).toBe(0);
    });

    it("should not move workloads when well-balanced", () => {
      const states: RegionMeshState[] = [
        {
          regionId: "us-east",
          name: "US East",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 150,
          avgHealthScore: 0.8,
          saturation: 0.5,
        },
        {
          regionId: "us-west",
          name: "US West",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 150,
          avgHealthScore: 0.8,
          saturation: 0.5,
        },
      ];

      const decisions = optimizer.optimize(states);

      expect(decisions.length).toBe(0);
    });

    it("should calculate realistic workload counts", () => {
      const states: RegionMeshState[] = [
        {
          regionId: "us-east",
          name: "US East",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 450,
          avgHealthScore: 0.3,
          saturation: 0.85,
        },
        {
          regionId: "us-west",
          name: "US West",
          totalWorkloads: 500,
          sovereignZones: [],
          avgLatencyMs: 100,
          avgHealthScore: 0.9,
          saturation: 0.3,
        },
      ];

      const decisions = optimizer.optimize(states);

      if (decisions.length > 0) {
        expect(decisions[0].workloadsToMove).toBeGreaterThan(0);
        expect(decisions[0].workloadsToMove).toBeLessThanOrEqual(1000);
      }
    });

    it("should generate confidence scores", () => {
      const states: RegionMeshState[] = [
        {
          regionId: "us-east",
          name: "US East",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 500,
          avgHealthScore: 0.3,
          saturation: 0.9,
        },
        {
          regionId: "us-west",
          name: "US West",
          totalWorkloads: 500,
          sovereignZones: [],
          avgLatencyMs: 100,
          avgHealthScore: 0.9,
          saturation: 0.2,
        },
      ];

      const decisions = optimizer.optimize(states);

      if (decisions.length > 0) {
        expect(decisions[0].confidenceScore).toBeGreaterThan(0);
        expect(decisions[0].confidenceScore).toBeLessThanOrEqual(100);
      }
    });

    it("should estimate latency improvement", () => {
      const states: RegionMeshState[] = [
        {
          regionId: "us-east",
          name: "US East",
          totalWorkloads: 1000,
          sovereignZones: [],
          avgLatencyMs: 500,
          avgHealthScore: 0.3,
          saturation: 0.9,
        },
        {
          regionId: "us-west",
          name: "US West",
          totalWorkloads: 500,
          sovereignZones: [],
          avgLatencyMs: 100,
          avgHealthScore: 0.9,
          saturation: 0.2,
        },
      ];

      const decisions = optimizer.optimize(states);

      if (decisions.length > 0) {
        expect(decisions[0].estimatedLatencyImprovement).toBeGreaterThanOrEqual(0);
        // 500ms - 150ms (corridor latency) = 350ms improvement
        expect(decisions[0].estimatedLatencyImprovement).toBeLessThanOrEqual(500);
      }
    });
  });

  describe("validateDecisions", () => {
    it("should validate optimization decisions", () => {
      const decisions = [
        {
          fromRegionId: "us-east",
          toRegionId: "us-west",
          workloadsToMove: 100,
          reason: "Load balance",
          confidenceScore: 85,
          estimatedLatencyImprovement: 100,
        },
      ];

      const validation = optimizer.validateDecisions(decisions);

      expect(validation.size).toBeGreaterThan(0);
      const entry = validation.get("us-east->us-west");
      expect(entry.valid).toBe(true);
    });

    it("should reject invalid decisions", () => {
      const decisions = [
        {
          fromRegionId: "us-east",
          toRegionId: "us-west",
          workloadsToMove: 0,
          reason: "Test",
          confidenceScore: 10,
          estimatedLatencyImprovement: -50,
        },
      ];

      const validation = optimizer.validateDecisions(decisions);

      const entry = validation.get("us-east->us-west");
      expect(entry.valid).toBe(false);
    });
  });
});
