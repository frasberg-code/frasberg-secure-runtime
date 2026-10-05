// Onboarding Routes
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, generateToken, AuthRequest } from '../middleware/auth';
import { validateBody, schemas } from '../middleware/validation';
import { createTenant } from '../services/tenants';
import { setTenantTier } from '../services/tiers';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Onboarding step 1: Create tenant
router.post(
  '/create-tenant',
  validateBody(
    z.object({
      name: schemas.tenantName,
      email: schemas.email,
    })
  ),
  asyncHandler(async (req, res) => {
    const tenant = await createTenant({
      name: req.body.name,
      region: 'us-west',
      tier: 'basic',
      metadata: { email: req.body.email, status: 'onboarding' },
    });

    const token = generateToken(tenant.id, req.body.email, 'admin');

    res.status(201).json({
      tenant,
      token,
      nextStep: 'select-region',
    });
  })
);

// Onboarding step 2: Select region and tier
router.post(
  '/:tenantId/configure',
  requireAuth,
  validateBody(
    z.object({
      region: schemas.region,
      tier: schemas.tier,
    })
  ),
  asyncHandler(async (req: AuthRequest, res) => {
    await setTenantTier(req.params.tenantId, req.body.tier);

    res.json({
      message: 'Configuration applied',
      nextStep: 'activate',
    });
  })
);

// Onboarding step 3: Activate autonomous mode
router.post(
  '/:tenantId/activate',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    res.json({
      message: 'Autonomous cloud activated',
      status: 'active',
      documentation: '/api/v1/docs/all',
    });
  })
);

export default router;
