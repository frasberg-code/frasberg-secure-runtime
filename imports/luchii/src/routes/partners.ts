// Partners Routes
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerPartner, listPartners, approvePartner, updatePartnerApis } from '../services/partners';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const status = req.query.status as string;
    const partners = await listPartners(status);
    res.json({ partners });
  })
);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateBody(
    z.object({
      name: z.string().min(1),
      tier: z.enum(['integration', 'reseller', 'strategic']),
      contactEmail: z.string().email(),
      apis: z.array(z.string()).optional(),
    })
  ),
  asyncHandler(async (req: AuthRequest, res) => {
    const partner = await registerPartner(req.body);
    res.status(201).json(partner);
  })
);

router.post(
  '/:id/approve',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req: AuthRequest, res) => {
    const partner = await approvePartner(req.params.id);
    res.json(partner);
  })
);

router.put(
  '/:id/apis',
  requireAuth,
  requireRole('admin'),
  validateBody(z.object({ apis: z.array(z.string()) })),
  asyncHandler(async (req: AuthRequest, res) => {
    const partner = await updatePartnerApis(req.params.id, req.body.apis);
    res.json(partner);
  })
);

export default router;
