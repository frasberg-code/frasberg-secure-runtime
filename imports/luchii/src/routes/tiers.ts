// Tiering Routes
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, requireTenant, AuthRequest } from '../middleware/auth';
import { validateBody, schemas } from '../middleware/validation';
import { listTiers, getTenantTier, setTenantTier } from '../services/tiers';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/list',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const tiers = await listTiers();
    res.json({ tiers });
  })
);

router.get(
  '/tenant',
  requireAuth,
  requireTenant,
  asyncHandler(async (req: AuthRequest, res) => {
    const tier = await getTenantTier(req.tenantId!);
    res.json({ tier });
  })
);

router.post(
  '/tenant',
  requireAuth,
  requireRole('admin'),
  requireTenant,
  validateBody(z.object({ tier: schemas.tier })),
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await setTenantTier(req.tenantId!, req.body.tier);
    res.json(updated);
  })
);

export default router;
