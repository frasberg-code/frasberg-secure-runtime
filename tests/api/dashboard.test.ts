import request from 'supertest';
import express from 'express';
import dashboardRouter from '../src/api/dashboard/routes';

describe('Dashboard API Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock kernel
    (app as any).kernel = {
      getDashboard: () => ({
        timestamp: new Date().toISOString(),
        systemScore: 85,
        safetyEnvelope: {
          slaOk: true,
          latencyOk: true,
          complianceOk: true,
          sovereigntyOk: true,
          meshOk: true,
          evolutionOk: true,
          overallHealthy: true,
        },
        mode: {
          currentMode: 'steady_state',
          allowedTransitions: ['evolution', 'federation'],
          lastTransitionTime: new Date().toISOString(),
        },
        sovereignStats: {
          residencyViolations: 0,
          corridorViolations: 0,
          overridesActive: 0,
          evolutionBlocksRecent: 0,
          meshImbalancedRegions: 0,
        },
        corridorHealth: [],
        metrics: {
          uptimePercent: 99.9,
          avgLatencyMs: 150,
          p99LatencyMs: 500,
          throughputRps: 10000,
          errorRatePercent: 0.1,
        },
        insights: [],
        recommendations: [],
      }),
      invalidateDashboardCache: () => {},
    };

    app.use((req, res, next) => {
      (req as any).kernel = (app as any).kernel;
      next();
    });

    app.use('/api/v1/dashboard', dashboardRouter);
  });

  describe('GET /api/v1/dashboard', () => {
    it('should return full dashboard state', async () => {
      const res = await request(app).get('/api/v1/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.systemScore).toBe(85);
      expect(res.body.safetyEnvelope).toBeDefined();
    });

    it('should return summary format', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .query({ format: 'summary' });

      expect(res.status).toBe(200);
      expect(res.body.systemScore).toBe(85);
      expect(res.body.safetyEnvelope).toBeDefined();
      expect(res.body.insightsCount).toBeDefined();
    });
  });

  describe('GET /api/v1/dashboard/health', () => {
    it('should return health summary', async () => {
      const res = await request(app).get('/api/v1/dashboard/health');

      expect(res.status).toBe(200);
      expect(res.body.systemScore).toBe(85);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('GET /api/v1/dashboard/insights', () => {
    it('should return insights', async () => {
      const res = await request(app).get('/api/v1/dashboard/insights');

      expect(res.status).toBe(200);
      expect(res.body.insightsCount).toBeDefined();
      expect(res.body.bySeverity).toBeDefined();
    });
  });

  describe('GET /api/v1/dashboard/recommendations', () => {
    it('should return recommendations', async () => {
      const res = await request(app).get('/api/v1/dashboard/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.recommendationsCount).toBeDefined();
    });
  });
});
