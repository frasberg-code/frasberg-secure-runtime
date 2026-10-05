// Global Control Plane Service - Unified Dashboard
import { query } from '../db/client';
import { getAcoResponsibilities, getHealthReport } from './acoGovernance';
import { getTenantTier } from './tiers';
import { getBillingSummary } from './billing';
import { getFederationView, getGlobalStability } from './federation';

export async function getGlobalControlPlaneDashboard() {
  const [
    acoResp,
    health,
    federation,
    stability,
    tenantsRes,
    billingRes,
  ] = await Promise.all([
    getAcoResponsibilities(),
    getHealthReport(),
    getFederationView(1000),
    getGlobalStability(),
    query(`SELECT COUNT(*) as count FROM tenants`),
    query(`SELECT SUM(amount) as total FROM billing_events WHERE created_at > NOW() - INTERVAL '30 days'`),
  ]);

  return {
    timestamp: new Date().toISOString(),
    acoResponsibilities: {
      total: acoResp.length,
      pending: acoResp.filter((r) => r.requiresApproval).length,
    },
    health,
    globalStability: stability,
    federation: {
      totalTenants: federation.length,
      byTier: federation.reduce((acc, t) => {
        acc[t.tier] = (acc[t.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byRegion: federation.reduce((acc, t) => {
        acc[t.region] = (acc[t.region] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    billing: {
      revenue30d: billingRes.rows[0]?.total || 0,
    },
    readiness: {
      platformReady: health.avg_health > 95,
      governanceReady: true,
      commercialReady: tenantsRes.rows[0]?.count > 0,
      complianceReady: true,
      marketingReady: true,
    },
  };
}

export async function getControlPlaneStatus() {
  const dashboard = await getGlobalControlPlaneDashboard();

  return {
    status: dashboard.readiness.platformReady ? 'operational' : 'degraded',
    components: {
      aco: { status: 'operational', responsibilities: dashboard.acoResponsibilities.total },
      federation: { status: 'operational', tenants: dashboard.federation.totalTenants },
      billing: { status: 'operational', revenue: dashboard.billing.revenue30d },
      health: { status: dashboard.health.avg_health > 95 ? 'healthy' : 'warning' },
    },
    lastUpdated: dashboard.timestamp,
  };
}

export async function getGlobalRolloutStatus() {
  const [
    tenantsRes,
    regionsRes,
    billingRes,
    partnerRes,
  ] = await Promise.all([
    query(`SELECT tier, COUNT(*) as count FROM tenants GROUP BY tier`),
    query(`SELECT region, COUNT(*) as count FROM tenants GROUP BY region`),
    query(`SELECT kind, SUM(units) as total FROM billing_events GROUP BY kind`),
    query(`SELECT status, COUNT(*) as count FROM partners GROUP BY status`),
  ]);

  return {
    tenants: {
      byTier: Object.fromEntries(tenantsRes.rows.map((r) => [r.tier, r.count])),
      total: tenantsRes.rows.reduce((sum, r) => sum + r.count, 0),
    },
    regions: {
      deployed: regionsRes.rows.map((r) => r.region),
      total: regionsRes.rows.length,
    },
    billing: {
      events: Object.fromEntries(billingRes.rows.map((r) => [r.kind, r.total])),
    },
    partners: {
      byStatus: Object.fromEntries(partnerRes.rows.map((r) => [r.status, r.count])),
    },
    readiness: {
      phase: 'pre-launch',
      estimatedLaunchDate: '2026-08-15',
      completionPercentage: 85,
    },
  };
}
