// Commercial Tiering Service
import { query } from '../db/client';
import { AutonomyTier } from '../types';

const DEFAULT_TIERS = [
  {
    id: 'basic',
    name: 'Autonomy Basic',
    features: ['assist_mode', 'cost_optimization'],
    pricing: { monthly: 99, perUnit: 0.01 },
  },
  {
    id: 'pro',
    name: 'Autonomy Pro',
    features: ['full_autonomy', 'sla_protection'],
    pricing: { monthly: 499, perUnit: 0.05 },
  },
  {
    id: 'enterprise',
    name: 'Autonomy Enterprise',
    features: ['global_autonomy', 'compliance', 'governance'],
    pricing: { monthly: 1999, perUnit: 0.1 },
  },
  {
    id: 'sovereign',
    name: 'Autonomy Sovereign',
    features: ['region_lock', 'regulated_compliance'],
    pricing: { monthly: 2999, perUnit: 0.15 },
  },
  {
    id: 'ultra',
    name: 'Autonomy Ultra',
    features: ['federation', 'global_routing', 'global_resilience'],
    pricing: { monthly: 4999, perUnit: 0.2 },
  },
];

export async function initializeTiers() {
  for (const tier of DEFAULT_TIERS) {
    await query(
      `INSERT INTO commercial_policies (tier, features, pricing, sla_guarantees)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tier) DO UPDATE SET features = $2, pricing = $3`,
      [
        tier.id,
        tier.features,
        JSON.stringify(tier.pricing),
        JSON.stringify({
          uptime: tier.id === 'basic' ? 99.5 : tier.id === 'pro' ? 99.9 : 99.99,
          support: tier.id === 'basic' ? 'email' : 'priority',
        }),
      ]
    );
  }
}

export async function listTiers() {
  const result = await query(`SELECT tier, features, pricing, sla_guarantees FROM commercial_policies`);
  return result.rows;
}

export async function getTenantTier(tenantId: string): Promise<AutonomyTier> {
  const result = await query(`SELECT tier FROM tenants WHERE id = $1`, [tenantId]);
  return result.rows[0]?.tier || 'basic';
}

export async function setTenantTier(tenantId: string, tier: AutonomyTier) {
  const now = new Date();
  const result = await query(
    `UPDATE tenants SET tier = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
    [tier, now, tenantId]
  );

  if (!result.rows.length) {
    throw new Error('Tenant not found');
  }

  // Log audit event
  await query(
    `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [tenantId, 'tier_upgraded', 'system', tenantId, JSON.stringify({ tier })]
  );

  return result.rows[0];
}
