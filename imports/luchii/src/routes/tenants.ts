// Tenant Management Routes
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { validateBody, schemas } from '../middleware/validation';
import {
  createTenant,
  getTenant,
  listTenants,
  updateTenantMetadata,
  deleteTenant,
} from '../services/tenants';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateBody(
    z.object({
      name: schemas.tenantName,
      tier: schemas.tier.optional(),
      region: schemas.region.optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  asyncHandler(async (req: AuthRequest, res) => {
    const tenant = await createTenant(req.body);
    res.status(201).json(tenant);
  })
);

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const tenant = await getTenant(req.params.id);
    res.json(tenant);
  })
);

router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const region = req.query.region as string;
    const tier = req.query.tier as string;
    const tenants = await listTenants(region, tier);
    res.json({ tenants });
  })
);

router.put(
  '/:id/metadata',
  requireAuth,
  validateBody(z.record(z.any())),
  asyncHandler(async (req: AuthRequest, res) => {
    const updated = await updateTenantMetadata(req.params.id, req.body);
    res.json(updated);
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const result = await deleteTenant(req.params.id);
    res.json(result);
  })
);

export default router;
