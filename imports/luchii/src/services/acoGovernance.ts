// Enhanced ACO Service with Full Governance Responsibilities
import { query, transaction } from '../db/client';
import { v4 as uuidv4 } from 'uuid';

export interface AcoResponsibility {
  category: 'health' | 'policy' | 'safety' | 'compliance' | 'sla' | 'routing' | 'upgrade' | 'epoch' | 'audit';
  description: string;
  requiresApproval: boolean;
  escalationPath?: string[];
}

export const ACO_RESPONSIBILITIES: Record<string, AcoResponsibility> = {
  'monitor_health': {
    category: 'health',
    description: 'Monitor global autonomy health across all regions and tenants',
    requiresApproval: false,
  },
  'approve_policy_change': {
    category: 'policy',
    description: 'Approve global policy changes before deployment',
    requiresApproval: true,
    escalationPath: ['security-review', 'legal-review'],
  },
  'approve_safety_change': {
    category: 'safety',
    description: 'Approve changes to safety envelope and failsafe boundaries',
    requiresApproval: true,
    escalationPath: ['safety-board'],
  },
  'approve_compliance_bundle': {
    category: 'compliance',
    description: 'Approve compliance bundles (GDPR, HIPAA, Sovereign)',
    requiresApproval: true,
    escalationPath: ['legal-review', 'compliance-team'],
  },
  'approve_sla_guarantee': {
    category: 'sla',
    description: 'Approve SLA guarantees and customer commitments',
    requiresApproval: true,
    escalationPath: ['finance-review', 'operations-review'],
  },
  'approve_region_routing': {
    category: 'routing',
    description: 'Approve region routing rules and failover strategies',
    requiresApproval: true,
  },
  'approve_upgrade': {
    category: 'upgrade',
    description: 'Approve autonomous system upgrades and migrations',
    requiresApproval: true,
    escalationPath: ['technical-review', 'safety-review'],
  },
  'review_epoch_report': {
    category: 'epoch',
    description: 'Review epoch reports for performance and optimization',
    requiresApproval: false,
  },
  'review_audit_logs': {
    category: 'audit',
    description: 'Review audit logs for compliance and security',
    requiresApproval: false,
  },
};

export async function getAcoResponsibilities() {
  return Object.entries(ACO_RESPONSIBILITIES).map(([id, resp]) => ({
    id,
    ...resp,
  }));
}

export async function recordApproval(
  responsibility: string,
  actor: string,
  action: 'approved' | 'rejected' | 'requested_review',
  payload: Record<string, any>
) {
  const id = uuidv4();
  const now = new Date();

  await query(
    `INSERT INTO aco_decisions (id, tenant_id, type, payload, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      null, // Global decision
      `${action}_${responsibility}`,
      JSON.stringify({ responsibility, actor, payload }),
      action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'pending',
      now,
      now,
    ]
  );

  return { id, responsibility, action, actor, timestamp: now };
}

export async function getHealthReport() {
  const result = await query(`
    SELECT
      COUNT(DISTINCT tenant_id) as total_tenants,
      AVG(score) as avg_health,
      AVG(uptime) as avg_uptime,
      AVG(sla_health) as avg_sla,
      COUNT(CASE WHEN score < 80 THEN 1 END) as critical_count,
      COUNT(CASE WHEN score < 90 THEN 1 END) as warning_count
    FROM health_status
    WHERE last_updated > NOW() - INTERVAL '1 hour'
  `);

  return result.rows[0] || {};
}

export async function getPolicySummary() {
  const result = await query(`
    SELECT key, value FROM global_config
    WHERE key LIKE 'policy_%'
  `);

  return result.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export async function getSafetyEnvelope() {
  const result = await query(`
    SELECT value FROM global_config
    WHERE key = 'safety_envelope'
  `);

  return result.rows[0]?.value || {
    maxConcurrentDecisions: 1000,
    maxDecisionLatency: 1000,
    failsafeThreshold: 0.5,
    recoveryTimeout: 300000,
  };
}

export async function getComplianceBundles() {
  const result = await query(`
    SELECT value FROM global_config
    WHERE key IN ('compliance_gdpr', 'compliance_hipaa', 'compliance_sovereign')
  `);

  return result.rows.map((row) => row.value);
}

export async function getSlaProfiles() {
  const result = await query(`
    SELECT tier, sla_guarantees FROM commercial_policies
  `);

  return result.rows.map((row) => ({
    tier: row.tier,
    slas: row.sla_guarantees,
  }));
}

export async function getAuditLogSummary(days: number = 7) {
  const result = await query(`
    SELECT
      action,
      COUNT(*) as count,
      COUNT(DISTINCT tenant_id) as affected_tenants
    FROM audit_logs
    WHERE created_at > NOW() - INTERVAL '${days} days'
    GROUP BY action
    ORDER BY count DESC
  `);

  return result.rows;
}

export async function getEpochReport(epochId: string) {
  const result = await query(`
    SELECT
      value as report
    FROM global_config
    WHERE key = $1
  `, [`epoch_${epochId}`]);

  return result.rows[0]?.report || null;
}

export async function recordEpochReport(
  epochId: string,
  metrics: {
    health: number;
    uptime: number;
    costSavings: number;
    optimizations: number;
    issues: string[];
  }
) {
  await query(
    `INSERT INTO global_config (key, value)
     VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = $2`,
    [`epoch_${epochId}`, JSON.stringify(metrics)]
  );

  return { epochId, ...metrics };
}
