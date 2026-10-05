import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AlertEngine } from "./AlertEngine";
import { Logger, getLogger } from "../../core/governance/logger";
import { GovernanceError } from "../../core/governance/errors";

const router = Router();
const logger = getLogger("AlertRoutes");

// Global alert engine
const alertEngine = new AlertEngine({
  channels: {
    console: true,
    email: { enabled: false, recipients: [] },
    webhook: { enabled: false, url: "" },
    slack: { enabled: false, webhookUrl: "" },
  },
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

// GET /api/v1/alerts - Get all alerts
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt((req.query.limit as string) || "100", 10);
    const alerts = alertEngine.getAllAlerts(Math.min(limit, 1000));

    res.json({
      timestamp: new Date().toISOString(),
      count: alerts.length,
      alerts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/alerts/active - Get active alerts
router.get("/active", (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeAlerts = alertEngine.getActiveAlerts();

    res.json({
      timestamp: new Date().toISOString(),
      count: activeAlerts.length,
      alerts: activeAlerts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/alerts/stats - Get alert statistics
router.get("/stats", (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = alertEngine.getAlertStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/alerts/:id/acknowledge - Acknowledge alert
router.post(
  "/:id/acknowledge",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { acknowledgedBy } = req.body;

      if (!acknowledgedBy) {
        throw new GovernanceError(
          "acknowledgedBy is required",
          "VALIDATION_ERROR",
          400
        );
      }

      const success = alertEngine.acknowledgeAlert(id, acknowledgedBy);

      if (!success) {
        throw new GovernanceError("Alert not found", "NOT_FOUND", 404);
      }

      res.json({
        timestamp: new Date().toISOString(),
        status: "acknowledged",
        alertId: id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/alerts/:id/resolve - Resolve alert
router.post(
  "/:id/resolve",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const success = alertEngine.resolveAlert(id);

      if (!success) {
        throw new GovernanceError("Alert not found", "NOT_FOUND", 404);
      }

      res.json({
        timestamp: new Date().toISOString(),
        status: "resolved",
        alertId: id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Apply error handler
router.use(errorHandler);

export default router;
export { alertEngine };
