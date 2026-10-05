// Public Status Page Routes
import { Router } from 'express';
import { getFederationView, getGlobalStability, getRegionHealth } from '../services/federation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public endpoints - no auth required
router.get(
  '/public/overview',
  asyncHandler(async (req, res) => {
    const [view, stability] = await Promise.all([
      getFederationView(100), // Limit to 100 for public view
      getGlobalStability(),
    ]);

    res.json({
      status: 'operational',
      tenants: view.length,
      averageHealth: stability.avg_health || 100,
      uptime: stability.avg_uptime || 100,
    });
  })
);

router.get(
  '/public/regions',
  asyncHandler(async (req, res) => {
    const regions = ['us-west', 'us-east', 'eu-central', 'apac', 'latam', 'middle-east', 'africa'];
    const regionStatus = await Promise.all(regions.map((r) => getRegionHealth(r as any)));

    const status = regions.map((region, idx) => ({
      region,
      status: regionStatus[idx].avg_health > 95 ? 'operational' : 'degraded',
      health: regionStatus[idx].avg_health || 100,
      tenants: regionStatus[idx].tenants || 0,
    }));

    res.json({ regions: status });
  })
);

router.get(
  '/public/federation',
  asyncHandler(async (req, res) => {
    const view = await getFederationView(50);
    res.json({
      tenants: view.map((t) => ({
        region: t.region,
        tier: t.tier,
        health: t.healthScore,
        sla: t.slaHealth,
      })),
    });
  })
);

export default router;
