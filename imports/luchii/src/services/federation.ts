// Federation & Health Monitoring Service
import { query } from '../db/client';
import { HealthStatus, RegionId } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function recordHealthStatus(data: {
  tenantId: string;
  region: RegionId;
  score: number;
  uptime: number;
  slaHealth: number;
}): Promise<HealthStatus> {
  const id = uuidv4();
  const now = new Date();

  const result = await query(
    `INSERT INTO health_status (id, tenant_id, region, score, uptime, sla_health, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING tenant_id, region, score, uptime, sla_health, last_updated`,
    [id, data.tenantId, data.region, data.score, data.uptime, data.slaHealth, now]
  );

  return result.rows[0];
}

export async function getHealthStatus(tenantId: string, region?: RegionId) {
  let query_text = `SELECT * FROM health_status WHERE tenant_id = $1`;
  const params: any[] = [tenantId];

  if (region) {
    query_text += ` AND region = $2`;
    params.push(region);
  }

  query_text += ` ORDER BY last_updated DESC`;

  const result = await query(query_text, params);
  return result.rows;
}

export async function getFederationView(limit: number = 1000) {
  const result = await query(
    `SELECT
      t.id,
      t.name,
      t.tier,
      t.region,
      h.score as health_score,
      h.uptime,
      h.sla_health,
      h.last_updated,
      COUNT(b.id) as events_count
    FROM tenants t
    LEFT JOIN health_status h ON t.id = h.tenant_id
    LEFT JOIN billing_events b ON t.id = b.tenant_id
    GROUP BY t.id, h.id
    ORDER BY h.last_updated DESC
    LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    tenantId: row.id,
    name: row.name,
    tier: row.tier,
    region: row.region,
    healthScore: row.health_score || 0,
    uptime: row.uptime || 0,
    slaHealth: row.sla_health || 0,
    eventsCount: parseInt(row.events_count || 0),
    lastUpdated: row.last_updated,
  }));
}

export async function getGlobalStability() {
  const result = await query(
    `SELECT
      COUNT(DISTINCT tenant_id) as total_tenants,
      AVG(score) as avg_health,
      AVG(uptime) as avg_uptime,
      AVG(sla_health) as avg_sla_health,
      MIN(score) as min_health,
      MAX(score) as max_health,
      COUNT(CASE WHEN score < 80 THEN 1 END) as unhealthy_count
    FROM health_status
    WHERE last_updated > NOW() - INTERVAL '1 hour'`
  );

  return result.rows[0] || {
    total_tenants: 0,
    avg_health: 0,
    avg_uptime: 0,
    avg_sla_health: 0,
  };
}

export async function getRegionHealth(region: RegionId) {
  const result = await query(
    `SELECT
      COUNT(DISTINCT tenant_id) as tenants,
      AVG(score) as avg_health,
      AVG(uptime) as avg_uptime,
      MAX(score) as peak_health,
      MIN(score) as worst_health
    FROM health_status
    WHERE region = $1 AND last_updated > NOW() - INTERVAL '1 hour'`,
    [region]
  );

  return result.rows[0] || {
    tenants: 0,
    avg_health: 0,
    avg_uptime: 0,
  };
}
