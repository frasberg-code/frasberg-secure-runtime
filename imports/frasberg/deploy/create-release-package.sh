#!/bin/bash
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

RELEASE_NAME="frasberg-ai-v1.0.0-public-final"
RELEASE_DIR="$REPO_ROOT/release/${RELEASE_NAME}"

echo "═══════════════════════════════════════════════════════"
echo "  FRASBERG CORE v1.0.0 - RELEASE PACKAGE CREATION"
echo "═══════════════════════════════════════════════════════"
echo ""

# Create release directory structure
echo "📁 Creating release directory structure..."
mkdir -p "$RELEASE_DIR"

# Copy core files
echo "📋 Copying files..."
[ -d "$REPO_ROOT/backend" ] && cp -r "$REPO_ROOT/backend" "$RELEASE_DIR/"
[ -d "$REPO_ROOT/frontend" ] && cp -r "$REPO_ROOT/frontend" "$RELEASE_DIR/"
[ -d "$REPO_ROOT/docs" ] && cp -r "$REPO_ROOT/docs" "$RELEASE_DIR/"
[ -d "$REPO_ROOT/deploy" ] && cp -r "$REPO_ROOT/deploy" "$RELEASE_DIR/"
[ -d "$REPO_ROOT/forks" ] && cp -r "$REPO_ROOT/forks" "$RELEASE_DIR/"
[ -d "$REPO_ROOT/demo-auditor-bundle" ] && cp -r "$REPO_ROOT/demo-auditor-bundle" "$RELEASE_DIR/"

# Copy documentation
[ -f "$REPO_ROOT/README.md" ] && cp "$REPO_ROOT/README.md" "$RELEASE_DIR/"
[ -f "$REPO_ROOT/system-manifest.json" ] && cp "$REPO_ROOT/system-manifest.json" "$RELEASE_DIR/"
[ -f "$REPO_ROOT/ACTIVATION_REPORT.md" ] && cp "$REPO_ROOT/ACTIVATION_REPORT.md" "$RELEASE_DIR/"
[ -f "$REPO_ROOT/LICENSE" ] && cp "$REPO_ROOT/LICENSE" "$RELEASE_DIR/" || echo "MIT License" > "$RELEASE_DIR/LICENSE"

# Create RELEASE_NOTES.md
echo "📝 Creating RELEASE_NOTES.md..."
cat > "$RELEASE_DIR/RELEASE_NOTES.md" << 'EOF'
# Frasberg AI v1.0.0 - Public Release

**Release Date:** 2026-02-08  
**Status:** Production Ready  
**License:** MIT

## Quick Start

```bash
# Extract and deploy
unzip frasberg-ai-v1.0.0-public-final.zip
cd frasberg-ai-v1.0.0-public-final

# Run activation
chmod +x deploy/post-pr-activation.sh
./deploy/post-pr-activation.sh

# Access services
# Canonical Core: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## What's Included

- Complete backend implementation
- Voice system (WebRTC, TTS/STT)
- Governance system (audit, Rule 902)
- Emotion & memory system
- Institution forks (Education, Healthcare)
- Frontend Admin UI
- Complete documentation
- Deployment infrastructure
- Docker configurations

## Architecture

45-layer sovereign operational intelligence system:
- 10 layers internal formation
- 35 layers external manifestation
- 24 dissolution boundaries
- 11 recursive collapses

## System Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- Python 3.11+
- 8GB RAM (16GB recommended)
- 10GB disk space

## Documentation

- API Docs: http://localhost:8000/docs (after deployment)
- Repository: https://github.com/FrasbergAI/frasberg

## Support

- Issues: https://github.com/FrasbergAI/frasberg/issues

---

**Frasberg AI** - Institution-Grade Intelligence
EOF

# Create ZIP archive
echo "📦 Creating ZIP archive..."
cd "$REPO_ROOT/release"
zip -r "${RELEASE_NAME}.zip" "${RELEASE_NAME}" -q

# Generate checksum
echo "🔐 Generating SHA256 checksum..."
sha256sum "${RELEASE_NAME}.zip" > "${RELEASE_NAME}.zip.sha256"

# Display info
echo ""
echo "✅ Release package created successfully!"
echo ""
echo "Release Package:"
ls -lh "${RELEASE_NAME}.zip"
echo ""
echo "SHA256 Checksum:"
cat "${RELEASE_NAME}.zip.sha256"
echo ""
echo "Location: $REPO_ROOT/release/${RELEASE_NAME}.zip"
echo ""
