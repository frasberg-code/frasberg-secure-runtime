// ACO Routes
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, requireTenant, AuthRequest } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import {
  getAcoDashboard,
  recordAcoDecision,
  listAcoDecisions,
  approveAcoDecision,
  rejectAcoDecision,
} from '../services/aco';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/dashboard',
  requireAuth,
  requireRole('admin'),
  requireTenant,
  asyncHandler(async (req: AuthRequest, res) => {
    const dashboard = await getAcoDashboard(req.tenantId!);
    res.json(dashboard);
  })
);

router.get(
  '/decisions',
  requireAuth,
  requireRole('admin'),
  requireTenant,
  asyncHandler(async (req: AuthRequest, res) => {
    const decisions = await listAcoDecisions(req.tenantId!);
    res.json({ decisions });
  })
);

router.post(
  '/decisions',
  requireAuth,
  requireRole('admin'),
  requireTenant,
  validateBody(
    z.object({
      type: z.enum(['approve_policy', 'approve_safety', 'approve_upgrade', 'request_review']),
      payload: z.record(z.any()),
    })
  ),
  asyncHandler(async (req: AuthRequest, res) => {
    const decision = await recordAcoDecision(req.tenantId!, req.body.type, req.body.payload);
    res.status(201).json(decision);
  })
);

router.post(
  '/decisions/:id/approve',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const decision = await approveAcoDecision(req.params.id);
    res.json(decision);
  })
);

router.post(
  '/decisions/:id/reject',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const decision = await rejectAcoDecision(req.params.id);
    res.json(decision);
  })
);

export default router;
