#!/bin/bash

# Frasberg AI 6.0.0 Release Script
# This script prepares and releases Frasberg AI 6.0.0

set -e

echo "🚀 Frasberg AI 6.0.0 Release Process"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify version updates
echo -e "${BLUE}Step 1: Verifying version updates...${NC}"
VERSION=$(cat VERSION)
if [ "$VERSION" != "6.0.0" ]; then
    echo -e "${YELLOW}Warning: VERSION file shows $VERSION, expected 6.0.0${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Version file verified: 6.0.0${NC}"
echo ""

# Step 2: Check git status
echo -e "${BLUE}Step 2: Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes.${NC}"
    echo "Please commit or stash your changes before creating a release."
    git status --short
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✓ Git status checked${NC}"
echo ""

# Step 3: Create release branch
echo -e "${BLUE}Step 3: Creating release branch...${NC}"
BRANCH_EXISTS=$(git branch --list release/6.0.0)
if [ -n "$BRANCH_EXISTS" ]; then
    echo -e "${YELLOW}Branch release/6.0.0 already exists${NC}"
    read -p "Switch to existing branch? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout release/6.0.0
    fi
else
    git checkout -b release/6.0.0
    echo -e "${GREEN}✓ Created and switched to release/6.0.0 branch${NC}"
fi
echo ""

# Step 4: Stage changes
echo -e "${BLUE}Step 4: Staging changes...${NC}"
git add VERSION
git add package.json
git add sdk/python/setup.py
git add cli/setup.py
git add sdk/python/frasberg_sdk/__init__.py
git add CHANGELOG_v6.0.0.md
git add docs/enterprise/README.md
git add docs/advanced-ai/README.md
git add docs/migration/v5-to-v6.md
echo -e "${GREEN}✓ Changes staged${NC}"
echo ""

# Step 5: Commit changes
echo -e "${BLUE}Step 5: Committing changes...${NC}"
git commit -m "Release Frasberg AI 6.0.0 - Enterprise Evolution

Major release combining enterprise features, advanced AI, and ecosystem integrations:

🔐 Enterprise Features:
- RBAC and JWT authentication
- OpenTelemetry observability
- Kubernetes operator with auto-scaling
- Multi-region support

🧠 Advanced AI:
- Neural-DNA hybrid computing (10× faster)
- Cross-datacenter swarms
- Federated learning
- Quantum-inspired temporal logic

🔌 Ecosystem & Integrations:
- LLM support: Gemini 2.0, Claude Opus 4, GPT-5
- Framework integrations: LangChain, LlamaIndex, CrewAI
- Cloud platforms: AWS, GCP, Azure one-click deploy
- New SDKs: TypeScript, Rust, Go

Breaking Changes:
- Python 3.11+ required
- API endpoints: /v1/ → /v2/
- New authentication system (RBAC)
- Configuration format updated

See CHANGELOG_v6.0.0.md for full details.
"
echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

# Step 6: Create git tag
echo -e "${BLUE}Step 6: Creating git tag...${NC}"
TAG_EXISTS=$(git tag -l "v6.0.0")
if [ -n "$TAG_EXISTS" ]; then
    echo -e "${YELLOW}Tag v6.0.0 already exists${NC}"
    read -p "Delete and recreate tag? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d v6.0.0
        git tag -a v6.0.0 -m "Frasberg AI 6.0.0 - Enterprise Evolution

Major features:
✅ Enterprise: RBAC, observability, Kubernetes operator
✅ Advanced AI: Neural-DNA hybrid, federated learning
✅ Ecosystem: 10+ LLM integrations, framework plugins
✅ Performance: 10× faster compute, 50% less memory

Breaking changes:
- Python 3.11+ required
- API v2 endpoints
- RBAC authentication

Full changelog: https://github.com/emeraldorbit/frasberg-ai-backend/blob/main/CHANGELOG_v6.0.0.md
"
        echo -e "${GREEN}✓ Tag recreated${NC}"
    fi
else
    git tag -a v6.0.0 -m "Frasberg AI 6.0.0 - Enterprise Evolution

Major features:
✅ Enterprise: RBAC, observability, Kubernetes operator
✅ Advanced AI: Neural-DNA hybrid, federated learning
✅ Ecosystem: 10+ LLM integrations, framework plugins
✅ Performance: 10× faster compute, 50% less memory

Breaking changes:
- Python 3.11+ required
- API v2 endpoints
- RBAC authentication

Full changelog: https://github.com/emeraldorbit/frasberg-ai-backend/blob/main/CHANGELOG_v6.0.0.md
"
    echo -e "${GREEN}✓ Tag v6.0.0 created${NC}"
fi
echo ""

# Step 7: Show summary
echo -e "${BLUE}Step 7: Release summary${NC}"
echo "========================"
echo "Branch: release/6.0.0"
echo "Tag: v6.0.0"
echo "Version: 6.0.0"
echo ""
git log --oneline -1
echo ""
git tag -n99 v6.0.0
echo ""

# Step 8: Push to remote
echo -e "${BLUE}Step 8: Ready to push to remote${NC}"
echo "This will push:"
echo "  - Branch: release/6.0.0"
echo "  - Tag: v6.0.0"
echo "  - Commits: $(git rev-list --count HEAD ^origin/main 2>/dev/null || echo 'N/A') new commits"
echo ""
read -p "Push to remote? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing branch..."
    git push origin release/6.0.0
    echo "Pushing tag..."
    git push origin v6.0.0
    echo -e "${GREEN}✓ Pushed to remote${NC}"
else
    echo -e "${YELLOW}Skipped pushing to remote${NC}"
    echo "To push manually, run:"
    echo "  git push origin release/6.0.0"
    echo "  git push origin v6.0.0"
fi
echo ""

# Step 9: Merge to main (optional)
echo -e "${BLUE}Step 9: Merge to main${NC}"
read -p "Merge release/6.0.0 to main? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout main
    git merge release/6.0.0
    git push origin main
    echo -e "${GREEN}✓ Merged to main and pushed${NC}"
else
    echo -e "${YELLOW}Skipped merging to main${NC}"
    echo "To merge manually, run:"
    echo "  git checkout main"
    echo "  git merge release/6.0.0"
    echo "  git push origin main"
fi
echo ""

# Step 10: Create GitHub release
echo -e "${BLUE}Step 10: Create GitHub release${NC}"
echo "Create a GitHub release at:"
echo "https://github.com/emeraldorbit/frasberg-ai-backend/releases/new?tag=v6.0.0"
echo ""
echo "Use this title:"
echo "Frasberg AI 6.0.0 - Enterprise Evolution"
echo ""
echo "Use CHANGELOG_v6.0.0.md for release notes"
echo ""

# Step 11: Next steps
echo -e "${GREEN}🎉 Release preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Create GitHub release (see above)"
echo "2. Update Product Hunt listing to 6.0.0"
echo "3. Post announcements on all platforms"
echo "4. Update documentation site"
echo "5. Monitor for issues"
echo ""
echo "Launch checklist:"
echo "☐ GitHub release created"
echo "☐ Product Hunt updated"
echo "☐ Discord announcement"
echo "☐ Twitter thread"
echo "☐ Hacker News comment"
echo "☐ Documentation deployed"
echo ""
echo "For Product Hunt launch at midnight:"
echo "./launch-product-hunt-v6.sh"
