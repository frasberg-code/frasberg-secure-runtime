-- This migration documents the Supabase Vault secrets that should be configured
-- Secrets must be added manually through the Supabase Dashboard or CLI

-- Navigate to: https://app.supabase.com/project/YOUR_PROJECT/settings/vault/secrets

-- Required Vault Secrets:

-- ElevenLabs API Keys
-- ELEVENLABS_FRASBERG_API_KEY
-- ELEVENLABS_FRASBERG_LIVE_CONVERSATION_KEY
-- ELEVENLABS_FRASBERG_MUSIC_ENGINE_KEY
-- ELEVENLABS_FRASBERG_VOICE_KEY
-- ELEVENLABS_FRASBERG_AUDIO_TOOLS_KEY
-- ELEVENLABS_SOVEREIGN_ADMIN_OPERATOR_KEY
-- ELEVENLABS_VOICEGATEWAY_STT_KEY
-- ELEVENLABS_VOICEGATEWAY_TTS_KEY
-- ELEVENLABS_FRASBERG_MUSIC_GENERATION_KEY

-- Runway ML API Keys (with rotation support)
-- RUNWAY_MODEL_KEY_PRIMARY
-- RUNWAY_MODEL_KEY_SECONDARY
-- RUNWAY_MODEL_KEY_TERTIARY

-- Model Endpoints
-- CHAT_MODEL_ENDPOINT
-- IMAGE_MODEL_ENDPOINT
-- VIDEO_MODEL_ENDPOINT
-- MODEL_ENDPOINT
-- MODEL_API_KEY

-- Supabase Configuration (auto-populated in Edge Functions)
-- SUPABASE_URL
-- SUPABASE_SERVICE_ROLE_KEY

-- Other Services
-- MONGO_API_KEY
-- DAILY_API_KEY
-- VOICE_GATEWAY_URL
-- VOICE_GATEWAY_TOKEN
-- ALERT_WEBHOOK

-- Storage Configuration
-- GENERATED_ASSETS_STORAGE_MODE (PUBLIC or RLS)

-- This is a documentation-only migration
-- Actual secrets must be added through Supabase Dashboard

SELECT 'Vault secrets must be configured manually through Supabase Dashboard' AS reminder;

COMMENT ON EXTENSION vault IS 'Stores encrypted API keys and secrets for Frasberg AI Backend';
