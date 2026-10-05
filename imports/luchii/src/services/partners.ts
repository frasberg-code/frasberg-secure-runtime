// Partner Program Service
import { query } from '../db/client';
import { Partner, PartnerTier } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function registerPartner(data: {
  name: string;
  tier: PartnerTier;
  contactEmail: string;
  apis?: string[];
}): Promise<Partner> {
  const id = uuidv4();
  const now = new Date();

  const result = await query(
    `INSERT INTO partners (id, name, tier, contact_email, apis, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, tier, contact_email, apis, status, created_at`,
    [id, data.name, data.tier, data.contactEmail, data.apis || [], 'pending', now]
  );

  return result.rows[0];
}

export async function listPartners(status?: string) {
  let query_text = `SELECT id, name, tier, contact_email, apis, status, created_at FROM partners`;
  const params: any[] = [];

  if (status) {
    query_text += ` WHERE status = $1`;
    params.push(status);
  }

  query_text += ` ORDER BY created_at DESC`;

  const result = await query(query_text, params);
  return result.rows;
}

export async function approvePartner(partnerId: string) {
  const now = new Date();
  const result = await query(
    `UPDATE partners SET status = $1 WHERE id = $2 RETURNING *`,
    ['active', partnerId]
  );

  if (!result.rows.length) {
    throw new Error('Partner not found');
  }

  return result.rows[0];
}

export async function updatePartnerApis(partnerId: string, apis: string[]) {
  const now = new Date();
  const result = await query(
    `UPDATE partners SET apis = $1 WHERE id = $2 RETURNING *`,
    [apis, partnerId]
  );

  if (!result.rows.length) {
    throw new Error('Partner not found');
  }

  return result.rows[0];
}
