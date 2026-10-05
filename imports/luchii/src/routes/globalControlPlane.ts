// Global Control Plane Routes
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getGlobalControlPlaneDashboard,
  getControlPlaneStatus,
  getGlobalRolloutStatus,
} from '../services/globalControlPlane';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/dashboard',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const dashboard = await getGlobalControlPlaneDashboard();
    res.json(dashboard);
  })
);

router.get(
  '/status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = await getControlPlaneStatus();
    res.json(status);
  })
);

router.get(
  '/rollout-status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const status = await getGlobalRolloutStatus();
    res.json(status);
  })
);

export default router;
