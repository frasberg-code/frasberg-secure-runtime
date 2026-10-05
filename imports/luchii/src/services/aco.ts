// Autonomous Cloud Operations (ACO) Service
import { query, transaction } from '../db/client';
import { AcoDecision } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function getAcoDashboard(tenantId: string) {
  const [healthRes, stabilityRes, auditRes, policiesRes] = await Promise.all([
    query(
      `SELECT tenant_id, score as health_score, sla_health FROM health_status
       WHERE tenant_id = $1 ORDER BY last_updated DESC LIMIT 1`,
      [tenantId]
    ),
    query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
              COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
       FROM aco_decisions WHERE tenant_id = $1`,
      [tenantId]
    ),
    query(
      `SELECT id, action, actor, resource, created_at FROM audit_logs
       WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    ),
    query(`SELECT key, value FROM global_config`),
  ]);

  return {
    health: healthRes.rows[0] || { health_score: 0, sla_health: 0 },
    stability: stabilityRes.rows[0],
    auditRecent: auditRes.rows,
    policies: policiesRes.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {}),
  };
}

export async function recordAcoDecision(
  tenantId: string,
  type: string,
  payload: any
): Promise<AcoDecision> {
  const id = uuidv4();
  const now = new Date();

  const result = await query(
    `INSERT INTO aco_decisions (id, tenant_id, type, payload, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, tenant_id, type, payload, status, created_at, updated_at`,
    [id, tenantId, type, JSON.stringify(payload), 'pending', now, now]
  );

  return result.rows[0];
}

export async function listAcoDecisions(tenantId: string, limit: number = 200) {
  const result = await query(
    `SELECT id, tenant_id, type, payload, status, created_at, updated_at
     FROM aco_decisions WHERE tenant_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit]
  );
  return result.rows;
}

export async function approveAcoDecision(decisionId: string) {
  const now = new Date();
  const result = await query(
    `UPDATE aco_decisions SET status = $1, updated_at = $2
     WHERE id = $3 RETURNING *`,
    ['approved', now, decisionId]
  );

  if (!result.rows.length) {
    throw new Error('Decision not found');
  }

  // Log audit event
  const decision = result.rows[0];
  await query(
    `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      decision.tenant_id,
      'aco_decision_approved',
      'system',
      decision.id,
      JSON.stringify({ type: decision.type }),
    ]
  );

  return decision;
}

export async function rejectAcoDecision(decisionId: string) {
  const now = new Date();
  const result = await query(
    `UPDATE aco_decisions SET status = $1, updated_at = $2
     WHERE id = $3 RETURNING *`,
    ['rejected', now, decisionId]
  );

  if (!result.rows.length) {
    throw new Error('Decision not found');
  }

  return result.rows[0];
}
