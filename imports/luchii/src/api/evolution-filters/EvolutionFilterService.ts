import { v4 as uuidv4 } from "uuid";
import {
  EvolutionFilter,
  FilterTypeSchema,
  EvolutionFilterSchema,
} from "../governance/types";
import {
  NotFoundError,
  ValidationError,
  ConstitutionalViolationError,
} from "../governance/errors";
import { Logger, getLogger } from "../governance/logger";
import { EvolutionPlan } from "./FilterEvaluationEngine";

export interface CreateFilterRequest {
  name: string;
  description?: string;
  type: string;
  criteria: Record<string, unknown>;
  enabled?: boolean;
}

export class EvolutionFilterService {
  private filters: Map<string, EvolutionFilter> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = getLogger("EvolutionFilterService");
  }

  createFilter(req: CreateFilterRequest): EvolutionFilter {
    // Validate type
    const typeResult = FilterTypeSchema.safeParse(req.type);
    if (!typeResult.success) {
      throw new ValidationError(`Invalid filter type: ${req.type}`);
    }

    const filter: EvolutionFilter = {
      id: uuidv4(),
      name: req.name,
      description: req.description,
      type: typeResult.data,
      criteria: req.criteria as never,
      enabled: req.enabled ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate entire filter schema
    const result = EvolutionFilterSchema.safeParse(filter);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    this.filters.set(filter.id, filter);
    this.logger.info(`Filter created: ${filter.id}`, { name: filter.name });
    return filter;
  }

  getFilter(id: string): EvolutionFilter {
    const filter = this.filters.get(id);
    if (!filter) {
      throw new NotFoundError("Evolution Filter", id);
    }
    return filter;
  }

  listFilters(
    enabled?: boolean,
    type?: string
  ): EvolutionFilter[] {
    let filters = Array.from(this.filters.values());

    if (enabled !== undefined) {
      filters = filters.filter((f) => f.enabled === enabled);
    }

    if (type) {
      filters = filters.filter((f) => f.type === type);
    }

    return filters;
  }

  updateFilter(id: string, updates: Partial<CreateFilterRequest>): EvolutionFilter {
    const filter = this.getFilter(id);

    if (updates.name !== undefined) {
      filter.name = updates.name;
    }
    if (updates.description !== undefined) {
      filter.description = updates.description;
    }
    if (updates.criteria !== undefined) {
      filter.criteria = updates.criteria as never;
    }
    if (updates.enabled !== undefined) {
      filter.enabled = updates.enabled;
    }

    filter.updatedAt = new Date().toISOString();

    // Validate updated filter
    const result = EvolutionFilterSchema.safeParse(filter);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    this.filters.set(id, filter);
    this.logger.info(`Filter updated: ${id}`, { name: filter.name });
    return filter;
  }

  deleteFilter(id: string): void {
    const filter = this.getFilter(id);
    this.filters.delete(id);
    this.logger.info(`Filter deleted: ${id}`, { name: filter.name });
  }

  applyFilter(id: string, plan: EvolutionPlan): boolean {
    const filter = this.getFilter(id);

    if (!filter.enabled) {
      return true;
    }

    // Evaluate plan against filter
    // This would use FilterEvaluationEngine in a real implementation
    this.logger.debug(`Applying filter ${id} to plan ${plan.id}`);

    // For now, return true - actual evaluation would be done by FilterEvaluationEngine
    return true;
  }

  applyMultipleFilters(ids: string[], plan: EvolutionPlan): {
    passed: boolean;
    results: Array<{ filterId: string; passed: boolean }>;
  } {
    const results = ids.map((id) => ({
      filterId: id,
      passed: this.applyFilter(id, plan),
    }));

    const passed = results.every((r) => r.passed);

    if (!passed) {
      this.logger.warn(`Plan ${plan.id} failed filter validation`, {
        failedFilters: results.filter((r) => !r.passed).map((r) => r.filterId),
      });
    }

    return { passed, results };
  }
}
