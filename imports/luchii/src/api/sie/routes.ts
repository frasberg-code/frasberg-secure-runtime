import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Logger, getLogger } from "../../core/governance/logger";
import { GovernanceError } from "../../core/governance/errors";

const router = Router();
const logger = getLogger("SIERoutes");

// Validation schemas
const SieQuerySchema = z.object({
  category: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// Error handler
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

// GET /api/v1/sie/analyze - Run SIE analysis
router.get("/analyze", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.runSIE) {
      throw new GovernanceError("SIE not available", "SIE_UNAVAILABLE", 503);
    }

    logger.info("Running SIE analysis");
    const output = kernel.runSIE();

    res.json({
      timestamp: new Date().toISOString(),
      insightsCount: output.insights.length,
      recommendationsCount: output.recommendations.length,
      insights: output.insights,
      recommendations: output.recommendations,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sie/insights - Get recent insights
router.get("/insights", (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = SieQuerySchema.parse(req.query);
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.runSIE) {
      throw new GovernanceError("SIE not available", "SIE_UNAVAILABLE", 503);
    }

    const output = kernel.runSIE();

    let insights = output.insights;

    // Filter by category
    if (query.category) {
      insights = insights.filter((i) => i.category === query.category);
    }

    // Filter by severity
    if (query.severity) {
      insights = insights.filter((i) => i.severity === query.severity);
    }

    // Sort by timestamp (newest first)
    insights.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const total = insights.length;
    const paginated = insights.slice(query.offset, query.offset + query.limit);

    res.json({
      timestamp: new Date().toISOString(),
      pagination: {
        offset: query.offset,
        limit: query.limit,
        total,
        returned: paginated.length,
      },
      insights: paginated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sie/insights/critical - Get critical insights only
router.get("/insights/critical", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.runSIE) {
      throw new GovernanceError("SIE not available", "SIE_UNAVAILABLE", 503);
    }

    const output = kernel.runSIE();

    const critical = output.insights.filter((i) => i.severity === "CRITICAL");

    res.json({
      timestamp: new Date().toISOString(),
      criticalCount: critical.length,
      insights: critical,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sie/recommendations - Get recent recommendations
router.get("/recommendations", (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = z
      .object({
        kind: z.string().optional(),
        limit: z.coerce.number().int().positive().max(100).default(50),
        offset: z.coerce.number().int().nonnegative().default(0),
      })
      .parse(req.query);

    const kernel = (req as any).kernel;
    if (!kernel || !kernel.runSIE) {
      throw new GovernanceError("SIE not available", "SIE_UNAVAILABLE", 503);
    }

    const output = kernel.runSIE();

    let recommendations = output.recommendations;

    // Filter by kind
    if (query.kind) {
      recommendations = recommendations.filter((r) => r.kind === query.kind);
    }

    // Sort by timestamp (newest first)
    recommendations.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply pagination
    const total = recommendations.length;
    const paginated = recommendations.slice(query.offset, query.offset + query.limit);

    res.json({
      timestamp: new Date().toISOString(),
      pagination: {
        offset: query.offset,
        limit: query.limit,
        total,
        returned: paginated.length,
      },
      recommendations: paginated,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sie/summary - SIE summary
router.get("/summary", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.runSIE) {
      throw new GovernanceError("SIE not available", "SIE_UNAVAILABLE", 503);
    }

    const output = kernel.runSIE();

    const summary = {
      timestamp: new Date().toISOString(),
      insights: {
        total: output.insights.length,
        bySeverity: {
          critical: output.insights.filter((i) => i.severity === "CRITICAL").length,
          high: output.insights.filter((i) => i.severity === "HIGH").length,
          medium: output.insights.filter((i) => i.severity === "MEDIUM").length,
          low: output.insights.filter((i) => i.severity === "LOW").length,
        },
        byCategory: output.insights.reduce(
          (acc, i) => {
            acc[i.category] = (acc[i.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      recommendations: {
        total: output.recommendations.length,
        byKind: output.recommendations.reduce(
          (acc, r) => {
            acc[r.kind] = (acc[r.kind] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };

    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// Apply error handler
router.use(errorHandler);

export default router;
