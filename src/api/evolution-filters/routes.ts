import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { EvolutionFilterService, CreateFilterRequest } from "./EvolutionFilterService";
import {
  validateInput,
  getPaginationParams,
  Pagination,
} from "../governance/validation";
import { GovernanceError } from "../governance/errors";
import { Logger, getLogger } from "../governance/logger";

const router = Router();
const filterService = new EvolutionFilterService();
const logger = getLogger("EvolutionFilterRoutes");

// Validation schemas
const CreateFilterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["SOVEREIGNTY", "SAFETY", "PERFORMANCE", "MESH"]),
  criteria: z.record(z.unknown()),
  enabled: z.boolean().optional(),
});

const UpdateFilterSchema = CreateFilterSchema.partial();

const ApplyFilterSchema = z.object({
  planId: z.string().uuid(),
  plan: z.object({
    id: z.string().uuid(),
    name: z.string(),
    sovereignty: z.record(z.unknown()),
    safety: z.record(z.number()),
    performance: z.record(z.number()),
    mesh: z.record(z.number()),
  }),
});

// Error handling middleware
function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof GovernanceError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof Error) {
    logger.error("Unhandled error", err);
    return res.status(500).json({
      error: err.message,
      code: "INTERNAL_ERROR",
    });
  }

  next(err);
}

// Routes

// POST /api/v1/evolution/filters - Create filter
router.post("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = validateInput<CreateFilterRequest>(CreateFilterSchema, req.body);
    const filter = filterService.createFilter(data);
    res.status(201).json(filter);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/evolution/filters - List filters
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const enabled = req.query.enabled
      ? req.query.enabled === "true"
      : undefined;
    const type = req.query.type as string | undefined;
    const { page, limit } = getPaginationParams(
      req.query.page,
      req.query.limit
    );

    const allFilters = filterService.listFilters(enabled, type);

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const filters = allFilters.slice(start, end);

    res.json({
      filters,
      pagination: {
        page,
        limit,
        total: allFilters.length,
        pages: Math.ceil(allFilters.length / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/evolution/filters/:id - Get filter
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = filterService.getFilter(req.params.id);
    res.json(filter);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/evolution/filters/:id - Update filter
router.put("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = validateInput<Partial<CreateFilterRequest>>(
      UpdateFilterSchema,
      req.body
    );
    const filter = filterService.updateFilter(req.params.id, updates);
    res.json(filter);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/evolution/filters/:id - Delete filter
router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    filterService.deleteFilter(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/evolution/filters/:id/apply - Apply filter to plan
router.post(
  "/:id/apply",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plan } = validateInput(ApplyFilterSchema, req.body);
      const result = filterService.applyFilter(req.params.id, plan);
      res.json({
        filterId: req.params.id,
        planId: plan.id,
        passed: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/evolution/filters/apply-multiple - Apply multiple filters
router.post(
  "/apply-multiple/batch",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        filterIds: z.array(z.string().uuid()),
        plan: ApplyFilterSchema.shape.plan,
      });
      const { filterIds, plan } = validateInput(schema, req.body);
      const result = filterService.applyMultipleFilters(filterIds, plan);
      res.json({
        planId: plan.id,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Apply error handler
router.use(errorHandler);

export default router;
