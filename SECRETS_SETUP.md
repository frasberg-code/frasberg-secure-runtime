# 🔐 Secrets Management Guide

This guide explains how to securely configure API keys and secrets for the Frasberg AI Backend.

## ⚠️ Security Best Practices

1. **NEVER commit `.env` files to version control**
2. **Rotate compromised keys immediately**
3. **Use different keys for development, staging, and production**
4. **Store production secrets in Supabase Vault**
5. **Use environment-specific `.env` files**

---

## 📋 Quick Start

### Step 1: Copy Environment Templates

```bash
# Root project
cp .env.example .env

# Voice Gateway
cp voice-gateway/.env.example voice-gateway/.env
```

### Step 2: Fill in Your API Keys

Edit each `.env` file and replace the placeholder values with your actual API keys.

**Never use the same keys across development and production!**

---

## 🔑 Required API Keys

### Supabase (Required)
- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_ANON_KEY**: Public anon key for client-side access
- **SUPABASE_SERVICE_ROLE_KEY**: Service role key for server-side operations
- **SUPABASE_DB_URL**: Direct database connection string

**Get these from:** Supabase Dashboard → Settings → API

### ElevenLabs (Required for Voice Features)
- **ELEVENLABS_FRASBERG_API_KEY**: Main Frasberg API key
- **ELEVENLABS_VOICEGATEWAY_STT_KEY**: Speech-to-Text key
- **ELEVENLABS_VOICEGATEWAY_TTS_KEY**: Text-to-Speech key
- **ELEVENLABS_FRASBERG_LIVE_CONVERSATION_KEY**: Live conversation API
- **ELEVENLABS_FRASBERG_MUSIC_ENGINE_KEY**: Music generation
- **ELEVENLABS_FRASBERG_AUDIO_TOOLS_KEY**: Audio processing tools

**Get these from:** ElevenLabs Dashboard → API Keys

### Runway ML (Required for Video/Image Generation)
- **RUNWAY_MODEL_KEY_PRIMARY**: Primary Runway key (video)
- **RUNWAY_MODEL_KEY_SECONDARY**: Secondary key (image)
- **RUNWAY_MODEL_KEY_TERTIARY**: Tertiary key (chat)

**Supports automatic failover rotation**

**Get these from:** Runway ML Dashboard → API Settings

### FRASBERG Custom Model Endpoint (Required)
- **FRASBERG_MODEL_ENDPOINT**: FRASBERG Core backend API endpoint
- **FRASBERG_MODEL_API_KEY**: API key for FRASBERG model authentication
- **MODEL_ENDPOINT**: Generic model endpoint (used by Edge Functions)
- **MODEL_API_KEY**: Generic model API key (used by Edge Functions)

**Configuration:** These are automatically configured to point to your Supabase Functions endpoint

### Other Services (Optional)
- **MONGO_API_KEY**: MongoDB Atlas API key
- **DAILY_API_KEY**: Daily.co WebRTC API key
- **ALERT_WEBHOOK**: Webhook URL for error alerts
- **GITHUB_TOKEN**: GitHub Personal Access Token for repo integration
- **GITHUB_REPO_URL**: GitHub repository URL

---

## 🏗️ Supabase Vault Setup (Production)

For production deployments, store secrets in Supabase Vault instead of `.env` files.

### Step 1: Access Supabase Dashboard

```
https://app.supabase.com/project/YOUR_PROJECT/settings/vault/secrets
```

### Step 2: Add Secrets to Vault

Click **"New Secret"** and add each key:

```env
# ElevenLabs Keys
ELEVENLABS_FRASBERG_API_KEY=sk_xxxxxxxxxxxxx
ELEVENLABS_VOICEGATEWAY_STT_KEY=sk_xxxxxxxxxxxxx
ELEVENLABS_VOICEGATEWAY_TTS_KEY=sk_xxxxxxxxxxxxx

# Runway Keys (with rotation)
RUNWAY_MODEL_KEY_PRIMARY=key_xxxxxxxxxxxxx
RUNWAY_MODEL_KEY_SECONDARY=key_xxxxxxxxxxxxx
RUNWAY_MODEL_KEY_TERTIARY=key_xxxxxxxxxxxxx

# Model Endpoints
CHAT_MODEL_ENDPOINT=https://api.runwayml.com/v1/chat
IMAGE_MODEL_ENDPOINT=https://api.runwayml.com/v1/images
VIDEO_MODEL_ENDPOINT=https://api.runwayml.com/v1/videos

# FRASBERG Model Configuration
FRASBERG_MODEL_ENDPOINT=https://YOUR_PROJECT.supabase.co/functions/v1/frasberg-ai-backend
FRASBERG_MODEL_API_KEY=your_frasberg_api_key_here
MODEL_ENDPOINT=https://YOUR_PROJECT.supabase.co/functions/v1/frasberg-ai-backend
MODEL_API_KEY=your_model_api_key_here

# GitHub Integration
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_REPO_URL=https://github.com/owner/repo

# Storage Mode
GENERATED_ASSETS_STORAGE_MODE=PUBLIC

# Alerting
ALERT_WEBHOOK=https://your-webhook-url.com/alerts
```

### Step 3: Access Vault Secrets in Edge Functions

Supabase Edge Functions automatically load secrets from Vault using `Deno.env.get()`:

```typescript
const apiKey = Deno.env.get("ELEVENLABS_FRASBERG_API_KEY");
```

---

## 🗂️ File Structure

```
frasberg-ai-backend/
├── .env.example              # Root environment template
├── .env                      # Root environment (DO NOT COMMIT)
├── .gitignore                # Protects .env files
├── voice-gateway/
│   ├── .env.example          # Voice gateway template
│   └── .env                  # Voice gateway env (DO NOT COMMIT)
└── supabase/
    └── functions/
        └── _shared/
            ├── runwayKeys.ts # Runway key rotation
            ├── cors.ts       # CORS headers
            ├── auth.ts       # Authentication
            ├── storage.ts    # Storage utilities
            ├── alerts.ts     # Error alerting
            └── types.ts      # Shared types
```

---

## 🔄 Key Rotation

### Automatic Runway Key Rotation

The `runwayKeys.ts` module supports automatic failover:

```typescript
import { getRunwayKeyFor } from "../_shared/runwayKeys.ts";

// Get key for specific model type with automatic failover
const videoKey = getRunwayKeyFor("video");
const imageKey = getRunwayKeyFor("image");
const chatKey = getRunwayKeyFor("chat");
```

### Manual Key Rotation Steps

1. **Generate new API key** in provider dashboard
2. **Add new key** to Supabase Vault or `.env`
3. **Update environment variable name** (e.g., `_KEY_V2`)
4. **Deploy updated code**
5. **Verify new key works**
6. **Revoke old key** in provider dashboard
7. **Remove old key** from Vault/`.env`

---

## 🧪 Testing Configuration

### Verify Environment Variables

```bash
# In voice-gateway directory
node -e "require('dotenv').config(); console.log(process.env.ELEVENLABS_API_KEY ? '✓ Keys loaded' : '✗ Keys missing')"
```

### Test Supabase Edge Function

```bash
# Deploy and test generate function
supabase functions deploy generate
supabase functions invoke generate --body '{"type":"chat","prompt":"test"}'
```

---

## 🚨 What to Do If Keys Are Compromised

### Immediate Actions

1. **Revoke compromised keys** in provider dashboards
2. **Generate new keys**
3. **Update Vault/`.env` files**
4. **Deploy updated configuration**
5. **Monitor for unauthorized usage**
6. **Review access logs**

### Provider Dashboards

- **ElevenLabs**: https://elevenlabs.io/app/settings/api-keys
- **Supabase**: https://app.supabase.com/project/_/settings/api
- **Runway ML**: https://app.runwayml.com/settings/api
- **MongoDB**: https://cloud.mongodb.com/v2#/org/YOUR_ORG/access/apiKeys

---

## 📚 Additional Resources

- [Supabase Vault Documentation](https://supabase.com/docs/guides/functions/secrets)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Runway ML API Docs](https://docs.runwayml.com/)
- [Environment Variables Best Practices](https://12factor.net/config)

---

## ✅ Verification Checklist

Before deploying to production:

- [ ] `.env` files are in `.gitignore`
- [ ] All required keys are configured
- [ ] Production keys are stored in Supabase Vault
- [ ] Development and production use different keys
- [ ] Alert webhook is configured
- [ ] Key rotation strategy is documented
- [ ] Team knows how to rotate compromised keys
- [ ] Access to provider dashboards is secured with 2FA

---

**Last Updated**: February 1, 2026
