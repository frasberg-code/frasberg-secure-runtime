import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { analyzer } from "../../analytics/HistoricalTrendAnalyzer";
import { Logger, getLogger } from "../../core/governance/logger";
import { GovernanceError } from "../../core/governance/errors";

const router = Router();
const logger = getLogger("AnalyticsRoutes");

// Validation schemas
const TimespanSchema = z.enum(["1h", "24h", "7d", "30d"]).default("24h");

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

// GET /api/v1/analytics/trends - Get trend analysis
router.get("/trends", (req: Request, res: Response, next: NextFunction) => {
  try {
    const timespan = TimespanSchema.parse(req.query.timespan || "24h");

    const trends = analyzer.getTrends(timespan);

    res.json({
      timestamp: new Date().toISOString(),
      timespan,
      trendCount: trends.length,
      trends,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/anomalies - Get anomalies
router.get("/anomalies", (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = analyzer.detectAnomalies();

    res.json({
      timestamp: new Date().toISOString(),
      anomalyCount: anomalies.length,
      anomalies,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/forecast - Get forecast
router.get("/forecast", (req: Request, res: Response, next: NextFunction) => {
  try {
    const forecast = analyzer.generateForecast();

    res.json({
      timestamp: new Date().toISOString(),
      forecastCount: forecast.length,
      forecast,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/insights - Get insight statistics
router.get("/insights", (req: Request, res: Response, next: NextFunction) => {
  try {
    const timespan = TimespanSchema.parse(req.query.timespan || "24h");

    const stats = analyzer.getInsightStats(timespan);

    res.json({
      timestamp: new Date().toISOString(),
      timespan,
      stats,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/recommendations - Get recommendation statistics
router.get(
  "/recommendations",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const timespan = TimespanSchema.parse(req.query.timespan || "24h");

      const stats = analyzer.getRecommendationStats(timespan);

      res.json({
        timestamp: new Date().toISOString(),
        timespan,
        stats,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/analytics/report - Get full analytics report
router.get("/report", (req: Request, res: Response, next: NextFunction) => {
  try {
    const timespan = TimespanSchema.parse(req.query.timespan || "24h");

    const report = analyzer.generateReport(timespan);

    res.json(report);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/history - Get historical records
router.get("/history", (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const records = analyzer.getHistoricalRecords(Math.min(limit, 1000));

    res.json({
      timestamp: new Date().toISOString(),
      recordCount: records.length,
      records,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/analytics/stats - Get analytics statistics
router.get("/stats", (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = analyzer.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err) {
    next(err);
  }
});

// Apply error handler
router.use(errorHandler);

export default router;
