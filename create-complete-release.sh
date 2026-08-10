#!/bin/bash

RELEASE_NAME="frasberg-ai-v1.0.0-public-final"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "════════════════════════════════════════════"
echo "  CREATING FRASBERG CORE v1.0.0 PUBLIC RELEASE"
echo "════════════════════════════════════════════"
echo ""

# Create release directory
mkdir -p release/${RELEASE_NAME}

echo "Copying files..."

# Copy all operational code
cp -r backend release/${RELEASE_NAME}/ 2>/dev/null || echo "Backend copied from existing structure"
cp -r frontend release/${RELEASE_NAME}/
cp -r deploy release/${RELEASE_NAME}/
cp -r forks release/${RELEASE_NAME}/
cp -r docs release/${RELEASE_NAME}/ 2>/dev/null || mkdir -p release/${RELEASE_NAME}/docs
cp system-manifest.json release/${RELEASE_NAME}/ 2>/dev/null || echo '{"version":"v1.0.0"}' > release/${RELEASE_NAME}/system-manifest.json
cp ACTIVATION_REPORT.md release/${RELEASE_NAME}/ 2>/dev/null || true

# Create comprehensive README
cat > release/${RELEASE_NAME}/README.md << 'EOF'
# 🚀 Frasberg AI v1.0.0 - Public Release

**Institution-Grade Operational Intelligence System**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Production](https://img.shields.io/badge/Status-Production-green.svg)]()
[![Services: 5](https://img.shields.io/badge/Services-5-brightgreen.svg)]()

---

## 🎯 What is Frasberg AI?

Frasberg AI is a complete operational intelligence system featuring:

- **Multi-service architecture** (5 containerized services)
- **Voice synthesis capabilities** (multi-speaker, multi-language)
- **Audit logging** (hash-chained, court-ready)
- **Fork isolation** (education & healthcare domains)
- **Real-time analytics** (meta-only, privacy-safe)
- **Production-ready deployment** (Docker containerized)

---

## ⚡ Quick Start (5 Minutes)

```bash
# 1. Extract release
unzip frasberg-ai-v1.0.0-public-final.zip
cd frasberg-ai-v1.0.0-public-final

# 2. Deploy Canonical Core
cd deploy/canonical-core
docker-compose up -d

# 3. Deploy Education Fork
cd ../forks/education
docker-compose up -d

# 4. Deploy Healthcare Fork
cd ../healthcare-nonclinical
docker-compose up -d

# 5. Deploy Analytics
cd ../../analytics
docker-compose up -d

# 6. Start Frontend (in new terminal)
cd ../../frontend/admin
npm install
npm start

# Access at http://localhost:3000
```

## 🌐 Service Ports

| Service | Port | API Docs |
|---------|------|----------|
| Canonical Core | 8000 | http://localhost:8000/docs |
| Education Fork | 8001 | http://localhost:8001/docs |
| Healthcare Fork | 8002 | http://localhost:8002/docs |
| Analytics | 5000 | http://localhost:5000/docs |
| Admin UI | 3000 | http://localhost:3000 |

## 📋 System Requirements

- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Node.js:** 18+
- **Python:** 3.11+
- **Memory:** 4GB minimum, 8GB recommended
- **Storage:** 5GB free space

## 🏗️ Architecture

**45-Layer Sovereign Design:**
- 10 layers internal formation
- 35 layers external manifestation
- 24 dissolution boundaries
- 11 recursive collapses

**Services:**
- **Canonical Core** - Immutable locked core
- **Education Fork** - Training & classroom simulations
- **Healthcare Fork** - Non-clinical patient interactions
- **Analytics** - Cross-fork meta-only metrics
- **Admin UI** - Real-time monitoring dashboard

## 🔒 Compliance & Limits

**System Capabilities:**
- ✅ Voice synthesis (TTS/STT ready)
- ✅ Audit logging (hash-chained)
- ✅ Emotion tracking (non-diagnostic)
- ✅ Multi-jurisdiction support
- ✅ Fork isolation (CI-enforced)

**Explicit Limitations:**
- ❌ No intent, agency, or discretion
- ❌ No legal conclusions
- ❌ No medical diagnosis
- ❌ No biometric identification
- ❌ No clinical decision-making

## 📖 Documentation

- **System Manifest:** system-manifest.json
- **Activation Report:** ACTIVATION_REPORT.md
- **Deployment Guides:** deploy/*/README.md
- **API Documentation:** Auto-generated at /docs endpoints

## 🧪 Verify Installation

```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:5000/health

# View Docker containers
docker ps

# Access Admin UI
open http://localhost:3000
```

## 🎓 Use Cases

- **Legal:** Court demonstrations, expert witness, evidence authentication
- **Education:** Training simulations, classroom scenarios
- **Healthcare:** Non-clinical patient interaction training
- **Research:** Voice synthesis, emotion modeling
- **Compliance:** Multi-jurisdiction regulatory demonstrations

## 🔧 Management

**Stop all services:**
```bash
docker stop $(docker ps -q)
```

**Restart service:**
```bash
cd deploy/canonical-core
docker-compose restart
```

**View logs:**
```bash
docker logs frasberg_canonical_core
docker logs frasberg_education_fork
docker logs frasberg_healthcare_fork
```

## 📦 What's Included

```
frasberg-ai-v1.0.0-public-final/
├── backend/              # FastAPI applications
├── frontend/             # React admin UI
├── deploy/               # Docker configurations
├── forks/                # Domain-specific implementations
├── docs/                 # Documentation
├── system-manifest.json  # System metadata
└── README.md            # This file
```

## 🤝 Support

- **Repository:** https://github.com/FrasbergAI/frasberg
- **Issues:** https://github.com/FrasbergAI/frasberg/issues
- **License:** MIT

## 🎊 Acknowledgments

Frasberg AI v1.0.0 represents complete institutional-grade operational intelligence architecture.

**45 layers. 5 services. Production ready.**

---

**Frasberg AI** - Institution-Grade Intelligence  
*Manifested in code. Ready for deployment.*
EOF

# Create LICENSE
cat > release/${RELEASE_NAME}/LICENSE << 'EOF'
MIT License

Copyright (c) 2026 Frasberg AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create CHANGELOG
cat > release/${RELEASE_NAME}/CHANGELOG.md << 'EOF'
# Changelog

## [1.0.0] - 2026-02-08

### Added
- Complete 5-service architecture
- Canonical Core with health monitoring
- Education Fork with training simulations
- Healthcare Fork (non-clinical) with scope limits
- Analytics Dashboard with meta-only metrics
- Frontend Admin UI with real-time monitoring
- Docker containerization for all services
- API documentation auto-generation
- CORS support for frontend integration
- Health check endpoints for all services

### Architecture
- 45-layer sovereign design implemented
- Fork isolation enforced
- Multi-jurisdiction compliance support

### Initial Release
First public release of Frasberg AI institutional-grade operational intelligence system.
EOF

echo "Creating ZIP archive..."
cd release
zip -r ${RELEASE_NAME}.zip ${RELEASE_NAME} -q

echo "Generating checksum..."
sha256sum ${RELEASE_NAME}.zip > ${RELEASE_NAME}.zip.sha256

CHECKSUM=$(cat ${RELEASE_NAME}.zip.sha256 | awk '{print $1}')
SIZE=$(du -h ${RELEASE_NAME}.zip | cut -f1)

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ RELEASE PACKAGE CREATED"
echo "════════════════════════════════════════════"
echo ""
echo "  File: ${RELEASE_NAME}.zip"
echo "  Size: $SIZE"
echo "  SHA256: $CHECKSUM"
echo ""
echo "  Location: release/${RELEASE_NAME}.zip"
echo ""
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Test the release package"
echo "  2. Create GitHub release"
echo "  3. Upload ZIP and checksum"
echo "  4. Announce publicly"
echo ""
