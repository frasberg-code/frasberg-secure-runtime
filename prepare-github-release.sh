#!/bin/bash

# Frasberg AI v1.0.0 - GitHub Release Preparation Script
# This script prepares everything for GitHub release but does NOT push
# (User must authenticate and push manually)

set -e

echo "=========================================="
echo "Frasberg AI v1.0.0 - Release Preparation"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Verify release package exists
echo -e "${BLUE}Step 1:${NC} Verifying release package..."
if [ -f "release/frasberg-ai-v1.0.0-public-final.zip" ]; then
    echo -e "${GREEN}✓${NC} Release package found"
    ls -lh release/frasberg-ai-v1.0.0-public-final.zip
else
    echo "ERROR: Release package not found!"
    exit 1
fi

# Step 2: Verify checksum
echo ""
echo -e "${BLUE}Step 2:${NC} Verifying package integrity..."
if [ -f "release/frasberg-ai-v1.0.0-public-final.zip.sha256" ]; then
    cd release
    if sha256sum -c frasberg-ai-v1.0.0-public-final.zip.sha256; then
        echo -e "${GREEN}✓${NC} Checksum verified"
    else
        echo "ERROR: Checksum verification failed!"
        exit 1
    fi
    cd ..
else
    echo "ERROR: Checksum file not found!"
    exit 1
fi

# Step 3: Show git status
echo ""
echo -e "${BLUE}Step 3:${NC} Current git status:"
git status --short

# Step 4: Create release notes summary
echo ""
echo -e "${BLUE}Step 4:${NC} Preparing release notes..."
cat > GITHUB_RELEASE_INSTRUCTIONS.md << 'EOF'
# GitHub Release Instructions

## 📦 Ready to Release: Frasberg AI v1.0.0

All files have been prepared for GitHub release. Follow these steps:

### 1. Commit Release Files
```bash
git add .
git commit -m "Frasberg AI v1.0.0 - Complete institutional-grade operational intelligence system

- 5 production services deployed
- Canonical Core + Education & Healthcare Forks
- Analytics Dashboard + Frontend Admin UI
- Complete Docker deployment configurations
- Cloud deployment guides (AWS/GCP/Azure)
- Comprehensive documentation

Production-ready. Fork-isolated. Institution-grade."
```

### 2. Create Git Tag
```bash
git tag -a v1.0.0 -m "Frasberg AI v1.0.0 - Public Release"
```

### 3. Push to GitHub
```bash
git push origin main
git push origin v1.0.0
```

### 4. Create GitHub Release

**Option A: Using GitHub CLI (gh)**
```bash
gh release create v1.0.0 \
  release/frasberg-ai-v1.0.0-public-final.zip \
  release/frasberg-ai-v1.0.0-public-final.zip.sha256 \
  --title "Frasberg AI v1.0.0 - Public Release" \
  --notes-file RELEASE_NOTES.md
```

**Option B: Using GitHub Web Interface**
1. Go to: https://github.com/frasberg/frasberg-ai-backend/releases/new
2. Tag version: `v1.0.0`
3. Release title: `Frasberg AI v1.0.0 - Public Release`
4. Copy content from RELEASE_NOTES.md into description
5. Attach files:
   - `release/frasberg-ai-v1.0.0-public-final.zip`
   - `release/frasberg-ai-v1.0.0-public-final.zip.sha256`
6. Check "Set as the latest release"
7. Click "Publish release"

### 5. Verify Release

After publishing, verify:
- [ ] Release is visible at /releases
- [ ] ZIP file is downloadable
- [ ] SHA256 checksum is available
- [ ] Release notes are formatted correctly
- [ ] Tag points to correct commit

---

## 📋 Release Checklist

- [x] All services deployed and tested
- [x] Release package created (218 MB)
- [x] SHA256 checksum generated
- [x] Release notes written
- [x] Cloud deployment guides created
- [x] API documentation verified
- [ ] Git commit created
- [ ] Git tag created
- [ ] Pushed to GitHub
- [ ] GitHub release published

---

## 🎉 Post-Release

After publishing, announce on:
- Project README
- Documentation site
- Community channels
- Social media (if applicable)

Share the download link:
`https://github.com/frasberg/frasberg-ai-backend/releases/download/v1.0.0/frasberg-ai-v1.0.0-public-final.zip`

EOF

echo -e "${GREEN}✓${NC} Release instructions created: GITHUB_RELEASE_INSTRUCTIONS.md"

# Step 5: Summary
echo ""
echo "=========================================="
echo "✅ Release Preparation Complete!"
echo "=========================================="
echo ""
echo "Files prepared:"
echo "  • release/frasberg-ai-v1.0.0-public-final.zip (218 MB)"
echo "  • release/frasberg-ai-v1.0.0-public-final.zip.sha256"
echo "  • RELEASE_NOTES.md"
echo "  • CLOUD_DEPLOYMENT.md"
echo "  • GITHUB_RELEASE_INSTRUCTIONS.md"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review GITHUB_RELEASE_INSTRUCTIONS.md"
echo "2. Commit changes: git add . && git commit -m 'Release v1.0.0'"
echo "3. Create tag: git tag -a v1.0.0 -m 'Frasberg AI v1.0.0'"
echo "4. Push: git push origin main && git push origin v1.0.0"
echo "5. Create GitHub release (see instructions)"
echo ""
echo -e "${GREEN}Frasberg AI v1.0.0 is ready for release! 🚀${NC}"
