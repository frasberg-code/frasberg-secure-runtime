// Monitoring API Routes
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getTelemetrySummary, telemetry, metrics } from '../services/telemetry';
import { getAuditLog, getAuditSummary, detectAnomalies } from '../services/auditLog';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Telemetry endpoints (admin only)
router.get(
  '/telemetry/summary',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const summary = getTelemetrySummary();
    res.json(summary);
  })
);

router.get(
  '/telemetry/metrics',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const name = req.query.name as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const metricsData = telemetry.getMetrics(startDate, endDate);
    const filtered = name ? metricsData.filter((m) => m.name === name) : metricsData;

    res.json({ metrics: filtered.slice(-1000) });
  })
);

router.get(
  '/telemetry/events',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const type = req.query.type as string;
    const tenantId = req.query.tenantId as string;

    const events = telemetry.getEvents(type, tenantId);
    res.json({ events: events.slice(0, 1000) });
  })
);

// Audit log endpoints
router.get(
  '/audit/log',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const auditLog = await getAuditLog({
      tenantId: req.query.tenantId as string,
      action: req.query.action as string,
      actor: req.query.actor as string,
      limit: parseInt((req.query.limit as string) || '1000'),
    });

    res.json({ auditLog });
  })
);

router.get(
  '/audit/summary',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const summary = await getAuditSummary(req.query.tenantId as string);
    res.json(summary);
  })
);

// Anomaly detection
router.get(
  '/audit/anomalies',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const anomalies = await detectAnomalies();
    res.json({ anomalies });
  })
);

// Health status endpoint
router.get(
  '/health/detailed',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const telemetrySummary = getTelemetrySummary();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      telemetry: telemetrySummary,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  })
);

export default router;
