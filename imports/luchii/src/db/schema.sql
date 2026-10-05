-- Frasberg Autonomous Cloud Database Schema

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'basic',
  region VARCHAR(50) NOT NULL DEFAULT 'us-west',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT valid_tier CHECK (tier IN ('basic', 'pro', 'enterprise', 'sovereign', 'ultra')),
  CONSTRAINT valid_region CHECK (region IN ('us-west', 'us-east', 'eu-central', 'apac', 'latam', 'middle-east', 'africa'))
);

CREATE INDEX idx_tenants_tier ON tenants(tier);
CREATE INDEX idx_tenants_region ON tenants(region);

-- ACO Decisions
CREATE TABLE IF NOT EXISTS aco_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_decision_type CHECK (type IN ('approve_policy', 'approve_safety', 'approve_upgrade', 'request_review')),
  CONSTRAINT valid_decision_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_aco_decisions_tenant ON aco_decisions(tenant_id);
CREATE INDEX idx_aco_decisions_status ON aco_decisions(status);

-- Billing Events
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL,
  units INTEGER NOT NULL,
  amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_billing_kind CHECK (kind IN ('decision', 'action', 'recovery', 'optimization', 'sla_protection', 'routing', 'calibration', 'drift_correction'))
);

CREATE INDEX idx_billing_events_tenant ON billing_events(tenant_id);
CREATE INDEX idx_billing_events_kind ON billing_events(kind);
CREATE INDEX idx_billing_events_created ON billing_events(created_at);

-- Partners
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  apis TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_partner_tier CHECK (tier IN ('integration', 'reseller', 'strategic')),
  CONSTRAINT valid_partner_status CHECK (status IN ('pending', 'approved', 'active', 'inactive'))
);

CREATE INDEX idx_partners_status ON partners(status);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Health Status
CREATE TABLE IF NOT EXISTS health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  region VARCHAR(50) NOT NULL,
  score SMALLINT CHECK (score >= 0 AND score <= 100),
  uptime DECIMAL(5, 2),
  sla_health DECIMAL(5, 2),
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_health_region CHECK (region IN ('us-west', 'us-east', 'eu-central', 'apac', 'latam', 'middle-east', 'africa'))
);

CREATE INDEX idx_health_status_tenant ON health_status(tenant_id);
CREATE INDEX idx_health_status_region ON health_status(region);

-- Commercial Policies
CREATE TABLE IF NOT EXISTS commercial_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(50) NOT NULL UNIQUE,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  pricing JSONB DEFAULT '{}'::jsonb,
  sla_guarantees JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_tier_policy CHECK (tier IN ('basic', 'pro', 'enterprise', 'sovereign', 'ultra'))
);

-- Documentation
CREATE TABLE IF NOT EXISTS documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(100) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Global Configuration
CREATE TABLE IF NOT EXISTS global_config (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
