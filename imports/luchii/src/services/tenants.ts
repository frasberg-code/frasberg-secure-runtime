// Tenant Management Service
import { query, transaction } from '../db/client';
import { Tenant, AutonomyTier, RegionId } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function createTenant(data: {
  name: string;
  tier?: AutonomyTier;
  region?: RegionId;
  metadata?: Record<string, any>;
}): Promise<Tenant> {
  return transaction(async (client) => {
    const id = uuidv4();
    const now = new Date();

    const result = await client.query(
      `INSERT INTO tenants (id, name, tier, region, created_at, updated_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, tier, region, created_at, updated_at, metadata`,
      [
        id,
        data.name,
        data.tier || 'basic',
        data.region || 'us-west',
        now,
        now,
        JSON.stringify(data.metadata || {}),
      ]
    );

    // Initialize health status
    await client.query(
      `INSERT INTO health_status (tenant_id, region, score, uptime, sla_health)
       VALUES ($1, $2, 100, 100, 100)`,
      [id, data.region || 'us-west']
    );

    return result.rows[0];
  });
}

export async function getTenant(tenantId: string): Promise<Tenant> {
  const result = await query(`SELECT * FROM tenants WHERE id = $1`, [tenantId]);

  if (!result.rows.length) {
    throw new Error('Tenant not found');
  }

  return result.rows[0];
}

export async function listTenants(region?: RegionId, tier?: AutonomyTier) {
  let query_text = `SELECT * FROM tenants`;
  const params: any[] = [];
  const conditions = [];

  if (region) {
    conditions.push(`region = $${params.length + 1}`);
    params.push(region);
  }

  if (tier) {
    conditions.push(`tier = $${params.length + 1}`);
    params.push(tier);
  }

  if (conditions.length > 0) {
    query_text += ` WHERE ${conditions.join(' AND ')}`;
  }

  query_text += ` ORDER BY created_at DESC`;

  const result = await query(query_text, params);
  return result.rows;
}

export async function updateTenantMetadata(tenantId: string, metadata: Record<string, any>) {
  const now = new Date();
  const result = await query(
    `UPDATE tenants SET metadata = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
    [JSON.stringify(metadata), now, tenantId]
  );

  if (!result.rows.length) {
    throw new Error('Tenant not found');
  }

  return result.rows[0];
}

export async function deleteTenant(tenantId: string) {
  const result = await query(`DELETE FROM tenants WHERE id = $1 RETURNING id`, [tenantId]);

  if (!result.rows.length) {
    throw new Error('Tenant not found');
  }

  return { deleted: true, tenantId };
}
