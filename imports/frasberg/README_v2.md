# 🚀 Frasberg v2.0.0

[![Release](https://img.shields.io/badge/release-v2.0.0-blue?style=for-the-badge)](https://github.com/FrasbergAI/frasberg/releases/tag/v2.0.0)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-success?style=for-the-badge)]()

**Institution-Grade Operational Intelligence with Voice & Governance**

---

## 🎉 What's New in v2.0.0

### 🎤 Complete Voice System
- **Text-to-Speech**: 11 languages, 6 emotional tones
- **Speech-to-Text**: Real-time transcription
- **WebRTC Streaming**: Bidirectional real-time voice
- **Voice Fingerprinting**: Non-biometric audit trails

### ⚖️ Court-Ready Governance
- **Hash-Chained Audit Logs**: Tamper-evident logging
- **FRE Rule 902(13)**: Auto-authenticated records
- **Expert Witness Mode**: Court-safe explanations
- **Digital Signatures**: Cryptographic verification

---

## ⚡ Quick Start v2.0.0

```bash
# Download v2.0.0
wget https://github.com/FrasbergAI/frasberg/releases/download/v2.0.0/frasberg-v2.0.0-complete.zip

# Extract and deploy
unzip frasberg-v2.0.0-complete.zip
cd frasberg-v2.0.0-complete

# Deploy all services
./deploy-all-v2.sh

# Access at http://localhost:3000
```

---

## 🌐 New API Endpoints (v2.0.0)

### Voice APIs
```
POST   /api/v2/voice/tts/synthesize        # Text-to-speech
POST   /api/v2/voice/stt/transcribe        # Speech-to-text
WS     /api/v2/voice/webrtc/stream         # Real-time streaming
POST   /api/v2/voice/fingerprint/generate  # Audio fingerprinting
GET    /api/v2/voice/languages             # Supported languages
```

### Governance APIs
```
POST   /api/v2/governance/audit/log        # Log audit event
GET    /api/v2/governance/audit/chain      # Get audit chain
GET    /api/v2/governance/audit/verify     # Verify chain integrity
POST   /api/v2/governance/rule902/certify  # Create Rule 902 certificate
POST   /api/v2/governance/witness/explain  # Expert witness explanation
```

---

## 🎯 v2.0.0 Use Cases

### Legal
- Court demonstrations with voice synthesis
- Expert witness testimony (technical only)
- FRE Rule 902(13) compliant evidence
- Audit trail verification

### Healthcare (Non-Clinical)
- Patient interaction training with voice
- Administrative workflow simulations
- Bedside communication training

### Education
- Multi-language classroom simulations
- Interactive voice-based training
- Real-time transcription for accessibility

---

## 📖 Documentation

- [Voice System Guide](docs/voice-system.md)
- [Governance Documentation](docs/governance.md)
- [Expert Witness Guide](docs/expert-witness.md)
- [API Reference](docs/api-reference.md)
- [Migration from v1.0.0](docs/migration-v1-to-v2.md)

---

## 🔒 Compliance & Limits

### New Capabilities (v2.0.0)
✅ Voice synthesis (11 languages)  
✅ Speech recognition (real-time)  
✅ Hash-chained audit logging  
✅ FRE Rule 902(13) compliance  
✅ Voice fingerprinting (non-biometric)

### Explicit Limitations (Unchanged)
❌ No intent, agency, or discretion  
❌ No legal conclusions  
❌ No medical diagnosis  
❌ No biometric identification  
❌ Voice fingerprints are audit-only (not identification)

---

## 🚀 Deployment

Same 5 services as v1.0.0, now with enhanced capabilities:

| Service | Port | New Features |
|---------|------|--------------|
| Canonical Core | 8000 | Voice & Governance APIs |
| Education Fork | 8001 | Voice-enabled simulations |
| Healthcare Fork | 8002 | Voice-enabled interactions |
| Analytics | 5000 | Voice usage metrics |
| Admin UI | 3000 | Voice system monitoring |

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file

---

**Frasberg v2.0.0 - Voice-Enabled Institution-Grade Intelligence**  
*Speak. Listen. Document. Verify.*
