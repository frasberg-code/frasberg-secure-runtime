// Core type definitions for Frasberg Autonomous Cloud

export type AutonomyTier = 'basic' | 'pro' | 'enterprise' | 'sovereign' | 'ultra';

export type BillingEventKind =
  | 'decision'
  | 'action'
  | 'recovery'
  | 'optimization'
  | 'sla_protection'
  | 'routing'
  | 'calibration'
  | 'drift_correction';

export type AcoDecisionType =
  | 'approve_policy'
  | 'approve_safety'
  | 'approve_upgrade'
  | 'request_review';

export type DocSection =
  | 'architecture'
  | 'governance'
  | 'safety'
  | 'compliance'
  | 'sla'
  | 'federation'
  | 'lifecycle'
  | 'epochs'
  | 'evolution'
  | 'upgrades'
  | 'launch';

export type PartnerTier = 'integration' | 'reseller' | 'strategic';

export type RegionId = 'us-west' | 'us-east' | 'eu-central' | 'apac' | 'latam' | 'middle-east' | 'africa';

// Database models

export interface Tenant {
  id: string;
  name: string;
  tier: AutonomyTier;
  region: RegionId;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface AcoDecision {
  id: string;
  tenantId: string;
  type: AcoDecisionType;
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingEvent {
  id: string;
  tenantId: string;
  kind: BillingEventKind;
  units: number;
  amount?: number;
  createdAt: Date;
}

export interface Partner {
  id: string;
  name: string;
  tier: PartnerTier;
  apis: string[];
  contactEmail: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'active' | 'inactive';
}

export interface AuditLog {
  id: string;
  tenantId: string;
  action: string;
  actor: string;
  resource: string;
  changes: Record<string, any>;
  createdAt: Date;
}

export interface HealthStatus {
  tenantId: string;
  region: RegionId;
  score: number; // 0-100
  uptime: number; // percentage
  slaHealth: number; // percentage
  lastUpdated: Date;
}
