-- Seed data for Frasberg Backend
-- This creates demo users and entitlements for testing

-- Insert demo entitlements
-- Note: Replace with actual user IDs after authentication setup

INSERT INTO ops.entitlements (user_id, tier, quota_daily, quota_monthly, feature_flags)
VALUES
  -- Free tier user
  (gen_random_uuid(), 'free', 50, 500, '{"chat": true, "image": false, "video": false}'::jsonb),
  -- Pro tier user
  (gen_random_uuid(), 'pro', 500, 10000, '{"chat": true, "image": true, "video": false}'::jsonb),
  -- Enterprise tier user
  (gen_random_uuid(), 'enterprise', 10000, 1000000, '{"chat": true, "image": true, "video": true, "priority_support": true}'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- Output confirmation
SELECT 
  tier,
  quota_daily,
  quota_monthly,
  feature_flags
FROM ops.entitlements
ORDER BY tier;
