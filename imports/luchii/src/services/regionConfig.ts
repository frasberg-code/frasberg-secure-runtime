// Multi-Region Configuration Service
import { RegionId } from '../types';

export interface RegionConfig {
  id: RegionId;
  name: string;
  endpoint: string;
  primaryDb: string;
  backupDb?: string;
  tier: number;
  slaTarget: number;
  complianceLevel: 'standard' | 'gdpr' | 'hipaa' | 'sovereign';
  dataResidency?: string;
}

export const REGION_CONFIGS: Record<RegionId, RegionConfig> = {
  'us-west': {
    id: 'us-west',
    name: 'US West (Primary)',
    endpoint: 'api-us-west.autonomous.cloud',
    primaryDb: 'postgresql://db-us-west-primary:5432/autonomous',
    backupDb: 'postgresql://db-us-west-backup:5432/autonomous',
    tier: 1,
    slaTarget: 99.99,
    complianceLevel: 'standard',
  },
  'us-east': {
    id: 'us-east',
    name: 'US East (Secondary)',
    endpoint: 'api-us-east.autonomous.cloud',
    primaryDb: 'postgresql://db-us-east-primary:5432/autonomous',
    backupDb: 'postgresql://db-us-east-backup:5432/autonomous',
    tier: 1,
    slaTarget: 99.99,
    complianceLevel: 'standard',
  },
  'eu-central': {
    id: 'eu-central',
    name: 'EU Central (GDPR)',
    endpoint: 'api-eu-central.autonomous.cloud',
    primaryDb: 'postgresql://db-eu-central-primary:5432/autonomous',
    backupDb: 'postgresql://db-eu-central-backup:5432/autonomous',
    tier: 1,
    slaTarget: 99.99,
    complianceLevel: 'gdpr',
    dataResidency: 'EU',
  },
  apac: {
    id: 'apac',
    name: 'Asia Pacific',
    endpoint: 'api-apac.autonomous.cloud',
    primaryDb: 'postgresql://db-apac-primary:5432/autonomous',
    backupDb: 'postgresql://db-apac-backup:5432/autonomous',
    tier: 2,
    slaTarget: 99.95,
    complianceLevel: 'standard',
  },
  latam: {
    id: 'latam',
    name: 'Latin America',
    endpoint: 'api-latam.autonomous.cloud',
    primaryDb: 'postgresql://db-latam-primary:5432/autonomous',
    tier: 2,
    slaTarget: 99.95,
    complianceLevel: 'standard',
  },
  'middle-east': {
    id: 'middle-east',
    name: 'Middle East & Africa',
    endpoint: 'api-mea.autonomous.cloud',
    primaryDb: 'postgresql://db-mea-primary:5432/autonomous',
    tier: 2,
    slaTarget: 99.9,
    complianceLevel: 'standard',
  },
  africa: {
    id: 'africa',
    name: 'Africa',
    endpoint: 'api-africa.autonomous.cloud',
    primaryDb: 'postgresql://db-africa-primary:5432/autonomous',
    tier: 3,
    slaTarget: 99.9,
    complianceLevel: 'standard',
  },
};

export function getRegionConfig(region: RegionId): RegionConfig {
  const config = REGION_CONFIGS[region];
  if (!config) throw new Error(`Unknown region: ${region}`);
  return config;
}

export function getAllRegions(): RegionConfig[] {
  return Object.values(REGION_CONFIGS);
}

export function getRegionsByTier(tier: number): RegionConfig[] {
  return getAllRegions().filter((r) => r.tier === tier);
}

export function getRegionsByCompliance(compliance: string): RegionConfig[] {
  return getAllRegions().filter((r) => r.complianceLevel === compliance);
}
