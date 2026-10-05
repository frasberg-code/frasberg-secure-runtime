// REGION ROUTING ENGINE - Autonomous Multi-Region Decision Making
import { query } from '../db/client';
import { v4 as uuidv4 } from 'uuid';

export interface RegionMetrics {
  region: string;
  health: number; // 0-1
  slaThreat: number; // 0-1
  latency: number; // ms
  cost: number; // normalized 0-1
  complianceOk: boolean;
  drift: number; // 0-1
  calibration: number; // 0-1
}

export interface RoutingDecision {
  tenantId: string;
  targetRegion: string;
  scoreMap: Record<string, number>;
  changed: boolean;
  reason: string;
  timestamp: Date;
}

function scoreRegion(m: RegionMetrics): number {
  const healthScore = m.health;
  const slaScore = 1 - m.slaThreat;
  const latencyScore = 1 - Math.min(m.latency, 500) / 500;
  const costScore = 1 - m.cost;
  const complianceScore = m.complianceOk ? 1 : 0;
  const driftScore = 1 - m.drift;
  const calibrationScore = m.calibration;

  return (
    healthScore * 0.25 +
    slaScore * 0.2 +
    latencyScore * 0.2 +
    costScore * 0.15 +
    complianceScore * 0.1 +
    driftScore * 0.05 +
    calibrationScore * 0.05
  );
}

export async function decideRegionRouting(
  tenantId: string,
  currentRegion: string,
  metrics: RegionMetrics[]
): Promise<RoutingDecision> {
  const scoreMap: Record<string, number> = {};
  let bestRegion = currentRegion;
  let bestScore = 0;

  for (const m of metrics) {
    const score = scoreRegion(m);
    scoreMap[m.region] = score;

    if (score > bestScore) {
      bestScore = score;
      bestRegion = m.region;
    }
  }

  const changed = bestRegion !== currentRegion;
  const reason = changed
    ? `Routing from ${currentRegion} to ${bestRegion} (score: ${bestScore.toFixed(3)})`
    : `Staying in ${currentRegion} (optimal score: ${bestScore.toFixed(3)})`;

  const decision: RoutingDecision = {
    tenantId,
    targetRegion: bestRegion,
    scoreMap,
    changed,
    reason,
    timestamp: new Date(),
  };

  if (changed) {
    await query(
      `INSERT INTO billing_events (tenant_id, kind, units)
       VALUES ($1, $2, $3)`,
      [tenantId, 'routing', 1]
    );

    await query(
      `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, 'autonomous_routing_decision', 'system', bestRegion, JSON.stringify(decision)]
    );
  }

  return decision;
}

export async function evaluateAllRegions(tenantId: string): Promise<RoutingDecision> {
  const metricsResult = await query(
    `SELECT region, score as health, 0 as slaThreat, 50 as latency, 0.4 as cost, true as complianceOk, 0.1 as drift, 0.9 as calibration
     FROM health_status WHERE tenant_id = $1 ORDER BY score DESC LIMIT 7`,
    [tenantId]
  );

  const metrics: RegionMetrics[] = metricsResult.rows.map((row: any) => ({
    region: row.region,
    health: row.health / 100,
    slaThreat: row.slaThreat,
    latency: row.latency,
    cost: row.cost,
    complianceOk: row.complianceOk,
    drift: row.drift,
    calibration: row.calibration,
  }));

  const currentTenant = await query(
    `SELECT region FROM tenants WHERE id = $1`,
    [tenantId]
  );

  const currentRegion = currentTenant.rows[0]?.region || 'us-west';

  return decideRegionRouting(tenantId, currentRegion, metrics);
}
