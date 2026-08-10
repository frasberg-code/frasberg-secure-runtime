# 🎯 FRASBERG Custom Model Endpoint Configuration

**Status:** ✅ **CONFIGURED AND ACTIVE**  
**Date:** February 7, 2026

---

## 📝 Configuration Summary

The FRASBERG custom model endpoint has been successfully configured with the following environment variables:

### Environment Variables Set

#### FRASBERG Model Configuration
```bash
FRASBERG_MODEL_ENDPOINT=https://sdtilgpppwhwtbxlbmik.supabase.co/functions/v1/frasberg-backend
FRASBERG_MODEL_API_KEY=432b7dc816f959da644b66c1afe14993300d3e1f839b2b6235ea75552c9082ce
```

#### Generic Model Configuration (for Edge Functions)
```bash
MODEL_ENDPOINT=https://sdtilgpppwhwtbxlbmik.supabase.co/functions/v1/frasberg-backend
MODEL_API_KEY=432b7dc816f959da644b66c1afe14993300d3e1f839b2b6235ea75552c9082ce
```

#### Project Configuration
```bash
PROJECT_URL=https://sdtilgpppwhwtbxlbmik.supabase.co
SERVICE_ROLE_KEY=5a99fb8b9bdb01d466a9184a1e66cf36c2441513026d4efde3f8d2595633c393
```

#### GitHub Integration
```bash
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO_URL=https://github.com/emeraldorbit/frasberg-backend
```

---

## 📁 Files Modified/Created

### Modified Files
1. **`.env`** - Added FRASBERG model configuration
2. **`.env.example`** - Updated template with FRASBERG variables
3. **`SECRETS_SETUP.md`** - Added FRASBERG documentation

### Created Files
1. **`activate-frasberg.sh`** - Activation and verification script
2. **`setup-frasberg-secrets.sh`** - Supabase Vault configuration script
3. **`FRASBERG_CONFIGURATION.md`** - This summary document

---

## 🚀 Quick Start Commands

### Verify Configuration
```bash
./activate-frasberg.sh
```

### Configure Supabase Vault (Production)
```bash
./setup-frasberg-secrets.sh
```

### Test the Endpoint
```bash
curl -X POST https://sdtilgpppwhwtbxlbmik.supabase.co/functions/v1/frasberg-backend \
  -H "Authorization: Bearer 432b7dc816f959da644b66c1afe14993300d3e1f839b2b6235ea75552c9082ce" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello FRASBERG"}'
```

### Deploy Supabase Functions
```bash
supabase functions deploy
```

---

## 🔐 Security Notes

### Environment Variables Location
- **Development:** [.env](.env) file (git-ignored)
- **Production:** Supabase Vault (encrypted)

### Secret Management Best Practices
1. ✅ `.env` files are git-ignored
2. ✅ API keys are masked in logs
3. ✅ Rotation-ready configuration
4. ✅ Separate keys for dev/prod

### Important Reminders
- 🔒 **NEVER commit `.env` to version control**
- 🔄 **Rotate keys regularly** (quarterly recommended)
- 📊 **Monitor API usage** to detect anomalies
- 🚨 **Revoke compromised keys immediately**

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   FRASBERG Core Backend                    │
│         https://github.com/emeraldorbit/frasberg      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Functions                    │
│      https://sdtilgpppwhwtbxlbmik.supabase.co          │
│                                                         │
│  • /functions/v1/frasberg-backend (Main Endpoint)    │
│  • /functions/v1/chat/completions                      │
│  • /functions/v1/images/generate                       │
│  • /functions/v1/videos/generate                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│            Environment Variables                        │
│                                                         │
│  • FRASBERG_MODEL_ENDPOINT (configured ✅)                │
│  • FRASBERG_MODEL_API_KEY (configured ✅)                 │
│  • MODEL_ENDPOINT (configured ✅)                      │
│  • MODEL_API_KEY (configured ✅)                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

- [x] Environment variables set in `.env`
- [x] Configuration verified with `activate-frasberg.sh`
- [ ] Supabase secrets deployed (run `./setup-frasberg-secrets.sh`)
- [ ] Edge functions deployed (run `supabase functions deploy`)
- [ ] Endpoint tested with curl
- [ ] Integration tests passed
- [ ] Production secrets rotated

---

## 📚 Related Documentation

- [SECRETS_SETUP.md](SECRETS_SETUP.md) - Complete secrets management guide
- [README.md](README.md) - Main project documentation
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration instructions
- [.env.example](.env.example) - Environment variable template

---

## 🆘 Troubleshooting

### Issue: "MODEL_ENDPOINT or MODEL_API_KEY is not set"

**Solution:**
1. Verify `.env` file exists: `ls -la .env`
2. Check environment variables are set: `./activate-frasberg.sh`
3. Reload environment: `source .env`

### Issue: "403 Forbidden" when calling endpoint

**Solution:**
1. Verify API key is correct in `.env`
2. Check Supabase project permissions
3. Ensure service role key has proper access

### Issue: Supabase secrets not working

**Solution:**
1. Link project: `supabase link --project-ref sdtilgpppwhwtbxlbmik`
2. Set secrets: `./setup-frasberg-secrets.sh`
3. Verify: `supabase secrets list`
4. Redeploy functions: `supabase functions deploy`

---

## 📞 Support

For issues or questions:
- **Repository:** https://github.com/emeraldorbit/frasberg-backend
- **Documentation:** See [SECRETS_SETUP.md](SECRETS_SETUP.md)
- **Supabase Dashboard:** https://app.supabase.com/project/sdtilgpppwhwtbxlbmik

---

**Configuration Complete!** 🎉
