// Enhanced ACO Governance Routes
import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import {
  getAcoResponsibilities,
  recordApproval,
  getHealthReport,
  getPolicySummary,
  getSafetyEnvelope,
  getComplianceBundles,
  getSlaProfiles,
  getAuditLogSummary,
} from '../services/acoGovernance';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get ACO responsibilities
router.get(
  '/responsibilities',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const responsibilities = await getAcoResponsibilities();
    res.json({ responsibilities });
  })
);

// Record approvals/rejections
router.post(
  '/approve',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const decision = await recordApproval(
      req.body.responsibility,
      req.userId!,
      req.body.action,
      req.body.payload
    );
    res.json(decision);
  })
);

// Health monitoring
router.get(
  '/health',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const report = await getHealthReport();
    res.json(report);
  })
);

// Policy review
router.get(
  '/policies',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const policies = await getPolicySummary();
    res.json(policies);
  })
);

// Safety envelope
router.get(
  '/safety-envelope',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const envelope = await getSafetyEnvelope();
    res.json(envelope);
  })
);

// Compliance bundles
router.get(
  '/compliance-bundles',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const bundles = await getComplianceBundles();
    res.json({ bundles });
  })
);

// SLA profiles
router.get(
  '/sla-profiles',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const profiles = await getSlaProfiles();
    res.json({ profiles });
  })
);

// Audit summary
router.get(
  '/audit-summary',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days as string) || 7;
    const summary = await getAuditLogSummary(days);
    res.json({ summary, period: `${days} days` });
  })
);

export default router;
