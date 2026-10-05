# Changelog - Frasberg AI v2.0.0

## [2.0.0] - 2026-02-08

### 🎉 Major Features Added

#### Voice System
- ✨ **Text-to-Speech (TTS)**: 11 languages, 6 emotional tones, 4 speaker profiles
- ✨ **Speech-to-Text (STT)**: Real-time transcription with confidence scoring
- ✨ **WebRTC Streaming**: Real-time bidirectional voice streaming
- ✨ **Voice Fingerprinting**: Non-biometric audio fingerprints for audit/replay

#### Governance System
- ✨ **Hash-Chained Audit Logging**: Tamper-evident event logging
- ✨ **FRE Rule 902(13) Compliance**: Auto-authenticated digital records
- ✨ **Expert Witness Mode**: Court-safe technical explanations
- ✨ **Digital Signatures**: Cryptographic signing with key rotation
- ✨ **Litigation Hold**: Incident response capabilities

#### Enhanced APIs
- ✨ `/api/v2/voice/*` - Complete voice API suite
- ✨ `/api/v2/governance/*` - Audit and compliance APIs
- ✨ `/api/v2/capabilities` - System capability discovery

### 🔧 Improvements
- Enhanced error handling across all endpoints
- Improved API documentation (OpenAPI 3.0)
- Better CORS configuration
- Performance optimizations

### 📖 Documentation
- Complete voice system guide
- Governance and compliance documentation
- Expert witness usage guide
- Court exhibit templates

### 🔒 Security
- Non-biometric voice fingerprinting (audit-only)
- Hash-chained audit logs (tamper-evident)
- Digital signature validation
- Enhanced scope limits documentation

### ⚠️ Breaking Changes
- API endpoints now under `/api/v2/` namespace
- Deprecated v1 endpoints (still supported for compatibility)

### 📦 What's Included
- Complete v1.0.0 features (all 5 services)
- Voice system (4 new modules)
- Governance system (4 new modules)
- Enhanced documentation
- Updated deployment scripts

---

## [1.0.0] - 2026-02-07

Initial public release
