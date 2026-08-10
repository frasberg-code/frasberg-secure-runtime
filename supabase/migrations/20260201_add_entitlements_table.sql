-- Create ops schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS ops;

-- Create entitlements table
CREATE TABLE IF NOT EXISTS ops.entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  quota_daily INT NOT NULL DEFAULT 50,
  quota_monthly INT NOT NULL DEFAULT 500,
  feature_flags JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON ops.entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_tier ON ops.entitlements(tier);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION ops.update_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_entitlements_updated_at ON ops.entitlements;
CREATE TRIGGER trigger_update_entitlements_updated_at
  BEFORE UPDATE ON ops.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION ops.update_entitlements_updated_at();

-- Enable Row Level Security
ALTER TABLE ops.entitlements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own entitlements"
  ON ops.entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to entitlements"
  ON ops.entitlements
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comment on table
COMMENT ON TABLE ops.entitlements IS 'User entitlements, quotas, and feature flags for Frasberg AI Backend';
