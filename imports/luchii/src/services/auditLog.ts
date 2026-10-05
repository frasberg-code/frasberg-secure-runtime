// Audit Trail Service for comprehensive logging
import { query } from '../db/client';
import { AuditLog } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function logAudit(
  tenantId: string | null,
  action: string,
  actor: string,
  resource: string,
  changes?: Record<string, any>
): Promise<AuditLog> {
  const id = uuidv4();
  const now = new Date();

  const result = await query(
    `INSERT INTO audit_logs (id, tenant_id, action, actor, resource, changes, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, tenant_id, action, actor, resource, changes, created_at`,
    [id, tenantId, action, actor, resource, JSON.stringify(changes || {}), now]
  );

  return result.rows[0];
}

export async function getAuditLog(
  filter?: {
    tenantId?: string;
    action?: string;
    actor?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  let query_text = `SELECT id, tenant_id, action, actor, resource, changes, created_at FROM audit_logs WHERE 1=1`;
  const params: any[] = [];

  if (filter?.tenantId) {
    query_text += ` AND tenant_id = $${params.length + 1}`;
    params.push(filter.tenantId);
  }

  if (filter?.action) {
    query_text += ` AND action = $${params.length + 1}`;
    params.push(filter.action);
  }

  if (filter?.actor) {
    query_text += ` AND actor = $${params.length + 1}`;
    params.push(filter.actor);
  }

  if (filter?.resource) {
    query_text += ` AND resource LIKE $${params.length + 1}`;
    params.push(`%${filter.resource}%`);
  }

  if (filter?.startDate) {
    query_text += ` AND created_at >= $${params.length + 1}`;
    params.push(filter.startDate);
  }

  if (filter?.endDate) {
    query_text += ` AND created_at <= $${params.length + 1}`;
    params.push(filter.endDate);
  }

  query_text += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
  params.push(filter?.limit || 1000);

  const result = await query(query_text, params);
  return result.rows;
}

export async function getAuditSummary(tenantId?: string) {
  const query_text = tenantId
    ? `SELECT action, COUNT(*) as count FROM audit_logs WHERE tenant_id = $1 GROUP BY action ORDER BY count DESC`
    : `SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action ORDER BY count DESC`;

  const params = tenantId ? [tenantId] : [];
  const result = await query(query_text, params);

  return result.rows.reduce(
    (acc, row) => {
      acc[row.action] = parseInt(row.count);
      return acc;
    },
    {} as Record<string, number>
  );
}

// Critical event detection
export async function detectAnomalies() {
  const result = await query(`
    SELECT
      action,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent_count
    FROM audit_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY action
    HAVING COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') > COUNT(*) * 2
  `);

  return result.rows;
}
