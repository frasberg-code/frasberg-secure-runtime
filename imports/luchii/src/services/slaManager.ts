// SLA Profile and Guarantee Management
import { query } from '../db/client';

export interface SlaProfile {
  tier: string;
  uptime: number; // percentage
  mttr: number; // mean time to recovery (seconds)
  rto: number; // recovery time objective (seconds)
  rpo: number; // recovery point objective (seconds)
  supportLevel: 'email' | 'priority' | '24/7' | 'dedicated';
  responseTime: number; // seconds
}

export const SLA_PROFILES: Record<string, SlaProfile> = {
  basic: {
    tier: 'basic',
    uptime: 99.5,
    mttr: 3600,
    rto: 3600,
    rpo: 60,
    supportLevel: 'email',
    responseTime: 86400,
  },
  pro: {
    tier: 'pro',
    uptime: 99.9,
    mttr: 900,
    rto: 1800,
    rpo: 30,
    supportLevel: 'priority',
    responseTime: 3600,
  },
  enterprise: {
    tier: 'enterprise',
    uptime: 99.95,
    mttr: 300,
    rto: 600,
    rpo: 10,
    supportLevel: '24/7',
    responseTime: 1800,
  },
  sovereign: {
    tier: 'sovereign',
    uptime: 99.99,
    mttr: 60,
    rto: 120,
    rpo: 5,
    supportLevel: '24/7',
    responseTime: 900,
  },
  ultra: {
    tier: 'ultra',
    uptime: 99.99,
    mttr: 30,
    rto: 60,
    rpo: 1,
    supportLevel: 'dedicated',
    responseTime: 300,
  },
};

export async function getSlaProfile(tier: string): Promise<SlaProfile> {
  return SLA_PROFILES[tier] || SLA_PROFILES.basic;
}

export async function getAllSlaProfiles(): Promise<SlaProfile[]> {
  return Object.values(SLA_PROFILES);
}

export async function validateSlaCompliance(
  tenantId: string,
  period: { start: Date; end: Date }
) {
  const tenantRes = await query(
    `SELECT tier FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (!tenantRes.rows[0]) {
    throw new Error('Tenant not found');
  }

  const tier = tenantRes.rows[0].tier;
  const sla = await getSlaProfile(tier);

  const healthRes = await query(
    `SELECT
      AVG(uptime) as avg_uptime,
      MIN(uptime) as min_uptime,
      COUNT(*) as samples
    FROM health_status
    WHERE tenant_id = $1
      AND last_updated >= $2
      AND last_updated <= $3`,
    [tenantId, period.start, period.end]
  );

  const health = healthRes.rows[0];
  const compliant = (health.avg_uptime || 0) >= sla.uptime;

  return {
    tier,
    sla,
    actual: {
      avgUptime: health.avg_uptime || 0,
      minUptime: health.min_uptime || 0,
      samples: health.samples || 0,
    },
    compliant,
    violation: compliant ? null : {
      required: sla.uptime,
      actual: health.avg_uptime || 0,
      gap: sla.uptime - (health.avg_uptime || 0),
    },
  };
}

export async function recordSlaViolation(
  tenantId: string,
  violation: {
    tier: string;
    required: number;
    actual: number;
    duration: number;
  }
) {
  await query(
    `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      tenantId,
      'sla_violation',
      'system',
      violation.tier,
      JSON.stringify(violation),
    ]
  );

  // Record as billing credit
  await query(
    `INSERT INTO billing_events (tenant_id, kind, units, amount)
     VALUES ($1, $2, $3, $4)`,
    [tenantId, 'sla_protection', 1, -50] // $50 credit for SLA miss
  );
}
