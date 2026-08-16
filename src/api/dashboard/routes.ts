import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Logger, getLogger } from "../../core/governance/logger";
import {
  ConstitutionalDashboardState,
  DashboardSnapshot,
} from "../../packages/dashboard/ConstitutionalDashboardTypes";
import { GovernanceError, ValidationError } from "../../core/governance/errors";

const router = Router();
const logger = getLogger("DashboardRoutes");

// Validation schemas
const QuerySchema = z.object({
  format: z.enum(["json", "summary"]).optional().default("json"),
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

// GET /api/v1/dashboard - Get full dashboard state
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = QuerySchema.parse(req.query);

    // Get dashboard from kernel
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.getDashboard) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    if (query.format === "summary") {
      res.json({
        timestamp: state.timestamp,
        systemScore: state.systemScore,
        safetyEnvelope: state.safetyEnvelope,
        mode: state.mode.currentMode,
        insightsCount: state.insights.length,
        recommendationsCount: state.recommendations.length,
      });
    } else {
      res.json(state);
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/health - Quick health summary
router.get("/health", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.getDashboard) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    res.json({
      timestamp: state.timestamp,
      systemScore: state.systemScore,
      status:
        state.systemScore >= 80
          ? "healthy"
          : state.systemScore >= 60
            ? "degraded"
            : "critical",
      safetyEnvelope: state.safetyEnvelope,
      sovereignStats: state.sovereignStats,
      criticalInsights: state.insights.filter((i) => i.severity === "CRITICAL").length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/insights - Get dashboard insights
router.get("/insights", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.getDashboard) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    res.json({
      timestamp: state.timestamp,
      insightsCount: state.insights.length,
      bySeverity: {
        critical: state.insights.filter((i) => i.severity === "CRITICAL").length,
        high: state.insights.filter((i) => i.severity === "HIGH").length,
        medium: state.insights.filter((i) => i.severity === "MEDIUM").length,
        low: state.insights.filter((i) => i.severity === "LOW").length,
      },
      insights: state.insights,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/recommendations - Get dashboard recommendations
router.get("/recommendations", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.getDashboard) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    res.json({
      timestamp: state.timestamp,
      recommendationsCount: state.recommendations.length,
      byKind: state.recommendations.reduce(
        (acc, r) => {
          acc[r.kind] = (acc[r.kind] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      recommendations: state.recommendations,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/corridors - Get corridor health
router.get("/corridors", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.getDashboard) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    res.json({
      timestamp: state.timestamp,
      totalCorridors: state.corridorHealth.length,
      byStatus: {
        healthy: state.corridorHealth.filter((c) => c.status === "healthy").length,
        degraded: state.corridorHealth.filter((c) => c.status === "degraded").length,
        critical: state.corridorHealth.filter((c) => c.status === "critical").length,
        frozen: state.corridorHealth.filter((c) => c.status === "frozen").length,
      },
      corridors: state.corridorHealth,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/metrics - Get system metrics
router.get("/metrics", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.getDashboard) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    res.json({
      timestamp: state.timestamp,
      metrics: state.metrics,
      systemScore: state.systemScore,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/dashboard/refresh - Invalidate cache and refresh
router.post("/refresh", (req: Request, res: Response, next: NextFunction) => {
  try {
    const kernel = (req as any).kernel;
    if (!kernel || !kernel.invalidateDashboardCache) {
      throw new GovernanceError("Dashboard not available", "DASHBOARD_UNAVAILABLE", 503);
    }

    kernel.invalidateDashboardCache();
    const state = kernel.getDashboard() as ConstitutionalDashboardState;

    res.json({
      timestamp: state.timestamp,
      status: "refreshed",
      systemScore: state.systemScore,
    });
  } catch (err) {
    next(err);
  }
});

// Apply error handler
router.use(errorHandler);

export default router;
