// Federation Routes
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getHealthStatus,
  getFederationView,
  getGlobalStability,
  getRegionHealth,
  recordHealthStatus,
} from '../services/federation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/view',
  requireAuth,
  asyncHandler(async (req, res) => {
    const view = await getFederationView();
    res.json({ tenants: view });
  })
);

router.get(
  '/stability',
  requireAuth,
  asyncHandler(async (req, res) => {
    const stability = await getGlobalStability();
    res.json(stability);
  })
);

router.get(
  '/region/:region/health',
  requireAuth,
  asyncHandler(async (req, res) => {
    const health = await getRegionHealth(req.params.region);
    res.json(health);
  })
);

router.get(
  '/tenant/:tenantId/health',
  requireAuth,
  asyncHandler(async (req, res) => {
    const health = await getHealthStatus(req.params.tenantId);
    res.json({ health });
  })
);

router.post(
  '/health/record',
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = await recordHealthStatus(req.body);
    res.status(201).json(status);
  })
);

export default router;
