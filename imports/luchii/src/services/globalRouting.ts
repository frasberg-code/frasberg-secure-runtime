// Global routing and tenant placement service
import { RegionId } from '../types';
import { query } from '../db/client';
import { getRegionConfig, getAllRegions } from './regionConfig';

export interface PlacementStrategy {
  name: string;
  algorithm: (tenantId: string, tier: string) => Promise<RegionId>;
}

// Strategy 1: Affinity (place near existing tenants)
export async function affinityPlacement(tier: string): Promise<RegionId> {
  const result = await query(
    `SELECT region, COUNT(*) as count FROM tenants WHERE tier = $1 GROUP BY region ORDER BY count DESC LIMIT 1`,
    [tier]
  );

  if (result.rows.length > 0) {
    return result.rows[0].region;
  }

  // Fallback to primary region
  return 'us-west';
}

// Strategy 2: Load balancing (place in least loaded region)
export async function loadBalancePlacement(): Promise<RegionId> {
  const result = await query(
    `SELECT t.region, COUNT(*) as count
     FROM tenants t
     GROUP BY t.region
     ORDER BY count ASC
     LIMIT 1`
  );

  if (result.rows.length > 0) {
    return result.rows[0].region;
  }

  return 'us-west';
}

// Strategy 3: Compliance-aware (place based on data residency requirements)
export async function compliancePlacement(complianceLevel: string): Promise<RegionId> {
  const regions = getAllRegions().filter((r) => r.complianceLevel === complianceLevel);

  if (regions.length === 0) {
    return 'us-west';
  }

  // Pick the least loaded compliant region
  const result = await query(
    `SELECT region, COUNT(*) as count FROM tenants WHERE region = ANY($1::text[]) GROUP BY region ORDER BY count ASC LIMIT 1`,
    [regions.map((r) => r.id)]
  );

  if (result.rows.length > 0) {
    return result.rows[0].region;
  }

  return regions[0].id;
}

// Strategy 4: Geography-aware (latency optimization)
export async function geographyPlacement(userLocation: string): Promise<RegionId> {
  // Simple mapping - in production, use geolocation service
  const mappings: Record<string, RegionId> = {
    'us-west': 'us-west',
    'us-east': 'us-east',
    'eu': 'eu-central',
    'asia': 'apac',
    'south-america': 'latam',
    'middle-east': 'middle-east',
    'africa': 'africa',
  };

  return mappings[userLocation] || 'us-west';
}

export async function placeTenant(
  tenantId: string,
  tier: string,
  preferredStrategy: 'affinity' | 'load-balance' | 'compliance' | 'geography' = 'load-balance'
): Promise<RegionId> {
  let region: RegionId;

  switch (preferredStrategy) {
    case 'affinity':
      region = await affinityPlacement(tier);
      break;
    case 'compliance':
      region = await compliancePlacement('gdpr');
      break;
    case 'geography':
      region = await geographyPlacement('us-west');
      break;
    case 'load-balance':
    default:
      region = await loadBalancePlacement();
  }

  return region;
}

export async function getRegionalHealth(region: RegionId) {
  const result = await query(
    `SELECT
      COUNT(DISTINCT tenant_id) as tenants,
      AVG(score) as avg_health,
      AVG(uptime) as avg_uptime,
      AVG(sla_health) as avg_sla,
      MAX(score) as peak,
      MIN(score) as worst
    FROM health_status
    WHERE region = $1 AND last_updated > NOW() - INTERVAL '1 hour'`,
    [region]
  );

  return result.rows[0] || {};
}

export async function getGlobalBalancing() {
  const regions = getAllRegions();
  const balancing = await Promise.all(
    regions.map(async (r) => ({
      region: r.id,
      health: await getRegionalHealth(r.id),
    }))
  );

  return balancing;
}
