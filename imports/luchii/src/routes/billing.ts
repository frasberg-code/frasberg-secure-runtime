// Billing Routes
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireTenant, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { getBillingSummary, getBillingHistory, calculateInvoice, recordBillingEvent } from '../services/billing';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/summary',
  requireAuth,
  requireTenant,
  asyncHandler(async (req: AuthRequest, res) => {
    const summary = await getBillingSummary(req.tenantId!);
    res.json(summary);
  })
);

router.get(
  '/history',
  requireAuth,
  requireTenant,
  asyncHandler(async (req: AuthRequest, res) => {
    const limit = parseInt(req.query.limit as string) || 1000;
    const history = await getBillingHistory(req.tenantId!, limit);
    res.json({ history });
  })
);

router.post(
  '/events',
  requireAuth,
  requireTenant,
  validateBody(
    z.object({
      kind: z.string(),
      units: z.number().int().positive().optional().default(1),
      amount: z.number().optional(),
    })
  ),
  asyncHandler(async (req: AuthRequest, res) => {
    const event = await recordBillingEvent(
      req.tenantId!,
      req.body.kind,
      req.body.units,
      req.body.amount
    );
    res.status(201).json(event);
  })
);

router.get(
  '/invoice/:year/:month',
  requireAuth,
  requireTenant,
  asyncHandler(async (req: AuthRequest, res) => {
    const month = new Date(parseInt(req.params.year), parseInt(req.params.month) - 1);
    const invoice = await calculateInvoice(req.tenantId!, month);
    res.json(invoice);
  })
);

export default router;
