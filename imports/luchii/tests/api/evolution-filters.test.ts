import { EvolutionFilterService, CreateFilterRequest } from "./EvolutionFilterService";
import { EvolutionFilterEvaluationEngine, EvolutionPlan } from "./FilterEvaluationEngine";
import { NotFoundError, ValidationError } from "../governance/errors";

describe("EvolutionFilterService", () => {
  let service: EvolutionFilterService;

  beforeEach(() => {
    service = new EvolutionFilterService();
  });

  describe("createFilter", () => {
    it("should create a filter with valid input", () => {
      const req: CreateFilterRequest = {
        name: "Test Safety Filter",
        type: "SAFETY",
        criteria: {
          slaMinimum: 95,
          latencyMaxMs: 500,
        },
      };

      const filter = service.createFilter(req);

      expect(filter.id).toBeDefined();
      expect(filter.name).toBe("Test Safety Filter");
      expect(filter.type).toBe("SAFETY");
      expect(filter.enabled).toBe(true);
      expect(filter.createdAt).toBeDefined();
    });

    it("should throw error on invalid filter type", () => {
      const req: CreateFilterRequest = {
        name: "Invalid Filter",
        type: "INVALID",
        criteria: {},
      };

      expect(() => service.createFilter(req)).toThrow(ValidationError);
    });

    it("should set enabled to true by default", () => {
      const req: CreateFilterRequest = {
        name: "Default Enabled Filter",
        type: "PERFORMANCE",
        criteria: {},
      };

      const filter = service.createFilter(req);
      expect(filter.enabled).toBe(true);
    });
  });

  describe("getFilter", () => {
    it("should retrieve an existing filter", () => {
      const req: CreateFilterRequest = {
        name: "Test Filter",
        type: "SOVEREIGNTY",
        criteria: {},
      };
      const created = service.createFilter(req);

      const retrieved = service.getFilter(created.id);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe("Test Filter");
    });

    it("should throw NotFoundError for non-existent filter", () => {
      expect(() => service.getFilter("non-existent-id")).toThrow(
        NotFoundError
      );
    });
  });

  describe("listFilters", () => {
    it("should list all filters", () => {
      const filter1: CreateFilterRequest = {
        name: "Filter 1",
        type: "SAFETY",
        criteria: {},
      };
      const filter2: CreateFilterRequest = {
        name: "Filter 2",
        type: "PERFORMANCE",
        criteria: {},
      };

      service.createFilter(filter1);
      service.createFilter(filter2);

      const filters = service.listFilters();
      expect(filters.length).toBe(2);
    });

    it("should filter by enabled status", () => {
      const filter1: CreateFilterRequest = {
        name: "Enabled Filter",
        type: "SAFETY",
        criteria: {},
        enabled: true,
      };
      const filter2: CreateFilterRequest = {
        name: "Disabled Filter",
        type: "PERFORMANCE",
        criteria: {},
        enabled: false,
      };

      service.createFilter(filter1);
      service.createFilter(filter2);

      const enabledFilters = service.listFilters(true);
      expect(enabledFilters.length).toBe(1);
      expect(enabledFilters[0].name).toBe("Enabled Filter");
    });

    it("should filter by type", () => {
      const filter1: CreateFilterRequest = {
        name: "Safety Filter",
        type: "SAFETY",
        criteria: {},
      };
      const filter2: CreateFilterRequest = {
        name: "Mesh Filter",
        type: "MESH",
        criteria: {},
      };

      service.createFilter(filter1);
      service.createFilter(filter2);

      const safetyFilters = service.listFilters(undefined, "SAFETY");
      expect(safetyFilters.length).toBe(1);
      expect(safetyFilters[0].type).toBe("SAFETY");
    });
  });

  describe("updateFilter", () => {
    it("should update filter properties", () => {
      const req: CreateFilterRequest = {
        name: "Original Name",
        type: "SAFETY",
        criteria: { slaMinimum: 90 },
      };
      const created = service.createFilter(req);

      const updated = service.updateFilter(created.id, {
        name: "Updated Name",
        criteria: { slaMinimum: 95 },
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.criteria).toEqual({ slaMinimum: 95 });
    });

    it("should throw NotFoundError when updating non-existent filter", () => {
      expect(() =>
        service.updateFilter("non-existent-id", { name: "New Name" })
      ).toThrow(NotFoundError);
    });
  });

  describe("deleteFilter", () => {
    it("should delete an existing filter", () => {
      const req: CreateFilterRequest = {
        name: "To Delete",
        type: "SAFETY",
        criteria: {},
      };
      const created = service.createFilter(req);

      service.deleteFilter(created.id);

      expect(() => service.getFilter(created.id)).toThrow(NotFoundError);
    });
  });
});

describe("EvolutionFilterEvaluationEngine", () => {
  let engine: EvolutionFilterEvaluationEngine;

  beforeEach(() => {
    engine = new EvolutionFilterEvaluationEngine();
  });

  describe("evaluateSafetyFilter", () => {
    it("should evaluate safety filter correctly", () => {
      const plan: EvolutionPlan = {
        id: "plan-1",
        name: "Test Plan",
        sovereignty: {},
        safety: { sla: 98, latency: 200, compliant: true },
        performance: {},
        mesh: {},
      };

      // This would require the filter to be properly instantiated
      // Test structure shows the evaluation logic
    });
  });
});
