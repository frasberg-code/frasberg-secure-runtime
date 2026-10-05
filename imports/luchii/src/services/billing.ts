// Autonomy Billing Service
import { query, transaction } from '../db/client';
import { BillingEvent, BillingEventKind } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function recordBillingEvent(
  tenantId: string,
  kind: BillingEventKind,
  units: number = 1,
  amount?: number
): Promise<BillingEvent> {
  const id = uuidv4();
  const now = new Date();

  const result = await query(
    `INSERT INTO billing_events (id, tenant_id, kind, units, amount, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, tenant_id, kind, units, amount, created_at`,
    [id, tenantId, kind, units, amount || null, now]
  );

  return result.rows[0];
}

export async function getBillingSummary(tenantId: string, startDate?: Date, endDate?: Date) {
  let query_text = `
    SELECT kind, COUNT(*) as count, SUM(units) as total_units, SUM(COALESCE(amount, 0)) as total_amount
    FROM billing_events
    WHERE tenant_id = $1
  `;

  const params: any[] = [tenantId];

  if (startDate) {
    params.push(startDate);
    query_text += ` AND created_at >= $${params.length}`;
  }

  if (endDate) {
    params.push(endDate);
    query_text += ` AND created_at <= $${params.length}`;
  }

  query_text += ` GROUP BY kind ORDER BY total_amount DESC`;

  const result = await query(query_text, params);

  const byKind = result.rows.reduce(
    (acc, row) => {
      acc[row.kind] = {
        count: parseInt(row.count),
        units: parseInt(row.total_units),
        amount: parseFloat(row.total_amount || 0),
      };
      return acc;
    },
    {}
  );

  const totalUnits = Object.values(byKind).reduce((sum, item: any) => sum + item.units, 0);
  const totalAmount = Object.values(byKind).reduce((sum, item: any) => sum + item.amount, 0);

  return {
    tenantId,
    totalUnits,
    totalAmount,
    byKind,
    period: { start: startDate, end: endDate },
  };
}

export async function getBillingHistory(tenantId: string, limit: number = 1000) {
  const result = await query(
    `SELECT id, tenant_id, kind, units, amount, created_at
     FROM billing_events
     WHERE tenant_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [tenantId, limit]
  );
  return result.rows;
}

export async function calculateInvoice(tenantId: string, month: Date) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const [summary, tierRes] = await Promise.all([
    getBillingSummary(tenantId, startDate, endDate),
    query(`SELECT tier FROM tenants WHERE id = $1`, [tenantId]),
  ]);

  const tier = tierRes.rows[0]?.tier || 'basic';
  const tierPricing = await getTierPricing(tier);

  let totalAmount = tierPricing.monthly;
  for (const [kind, data] of Object.entries(summary.byKind)) {
    totalAmount += (data as any).amount;
  }

  return {
    tenantId,
    month,
    tier,
    basePrice: tierPricing.monthly,
    events: summary.byKind,
    totalAmount,
    status: 'draft',
    createdAt: new Date(),
  };
}

async function getTierPricing(tier: string) {
  const result = await query(`SELECT pricing FROM commercial_policies WHERE tier = $1`, [tier]);
  return result.rows[0]?.pricing || { monthly: 0 };
}
