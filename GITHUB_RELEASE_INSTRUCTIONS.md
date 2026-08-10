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
1. Go to: https://github.com/FrasbergAI/frasberg/releases/new
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

### 6. Clean Up Existing Published Releases

If earlier GitHub releases still show `Sofia` or `Sofia Core` in the title or body, edit them manually in the GitHub Releases UI after publishing the corrected Frasberg release content.

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
`https://github.com/FrasbergAI/frasberg/releases/download/v1.0.0/frasberg-ai-v1.0.0-public-final.zip`
