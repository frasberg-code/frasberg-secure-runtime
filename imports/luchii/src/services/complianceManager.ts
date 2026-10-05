// Enhanced Compliance Management Service
import { query } from '../db/client';

export interface ComplianceBundle {
  id: string;
  name: string;
  regions: string[];
  controls: string[];
  dataResidency?: string;
  auditRequired: boolean;
  certifications: string[];
}

export const COMPLIANCE_BUNDLES: Record<string, ComplianceBundle> = {
  standard: {
    id: 'standard',
    name: 'Standard Compliance',
    regions: ['us-west', 'us-east'],
    controls: ['encryption_at_rest', 'encryption_in_transit', 'access_logging'],
    auditRequired: false,
    certifications: ['SOC2'],
  },
  gdpr: {
    id: 'gdpr',
    name: 'GDPR Compliance',
    regions: ['eu-central'],
    controls: [
      'data_residency_eu',
      'right_to_deletion',
      'data_portability',
      'breach_notification_72h',
      'dpia_required',
    ],
    dataResidency: 'EU',
    auditRequired: true,
    certifications: ['SOC2', 'GDPR'],
  },
  hipaa: {
    id: 'hipaa',
    name: 'HIPAA Compliance',
    regions: ['us-west', 'us-east'],
    controls: [
      'encryption_aes256',
      'access_controls_rbac',
      'audit_controls_18_months',
      'breach_notification_60d',
      'physical_access_controls',
    ],
    auditRequired: true,
    certifications: ['HIPAA', 'BAA'],
  },
  sovereign: {
    id: 'sovereign',
    name: 'Sovereign Cloud',
    regions: ['eu-central', 'apac', 'latam', 'middle-east'],
    controls: [
      'no_data_export',
      'regional_encryption_keys',
      'no_third_party_access',
      'government_inspection',
    ],
    auditRequired: true,
    certifications: ['National compliance'],
  },
};

export async function getComplianceBundle(id: string): Promise<ComplianceBundle> {
  return COMPLIANCE_BUNDLES[id] || COMPLIANCE_BUNDLES.standard;
}

export async function getComplianceBundlesForRegion(region: string) {
  return Object.values(COMPLIANCE_BUNDLES).filter((b) => b.regions.includes(region));
}

export async function verifyCompliance(
  tenantId: string,
  bundleId: string
): Promise<{ compliant: boolean; issues: string[] }> {
  const bundle = await getComplianceBundle(bundleId);

  // Check tenant region matches bundle requirements
  const tenantRes = await query(
    `SELECT region FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (!tenantRes.rows[0]) {
    return { compliant: false, issues: ['Tenant not found'] };
  }

  const tenantRegion = tenantRes.rows[0].region;
  const issues: string[] = [];

  if (!bundle.regions.includes(tenantRegion)) {
    issues.push(
      `Tenant region ${tenantRegion} not allowed for ${bundle.name}. Allowed: ${bundle.regions.join(', ')}`
    );
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}

export async function recordComplianceAudit(
  tenantId: string,
  bundleId: string,
  result: 'pass' | 'fail',
  findings: string[]
) {
  const auditId = `audit_${Date.now()}`;

  await query(
    `INSERT INTO audit_logs (tenant_id, action, actor, resource, changes)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      tenantId,
      `compliance_audit_${result}`,
      'system',
      `${bundleId}`,
      JSON.stringify({ findings, timestamp: new Date() }),
    ]
  );

  return { auditId, bundleId, result, findings };
}
