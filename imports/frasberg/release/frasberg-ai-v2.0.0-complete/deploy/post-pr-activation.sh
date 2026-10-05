#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════"
echo "  FRASBERG CORE v1.0.0 - POST-PR ACTIVATION SEQUENCE"
echo "═══════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# PHASE A: Pull completed code
echo "📥 PHASE A: Pulling completed code..."
cd "$REPO_ROOT"
git checkout main
git pull origin main
echo "✅ Code updated"
echo ""

# PHASE B: Rebuild Canonical Core
echo "🔨 PHASE B: Rebuilding Canonical Core..."
cd "$REPO_ROOT/deploy/canonical-core"
docker-compose down
docker-compose build --no-cache
docker-compose up -d
echo "⏳ Waiting for service startup..."
sleep 10

if curl -s -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Canonical Core operational"
else
    echo "⚠️  Canonical Core health check failed"
fi
echo ""

# PHASE C: Deploy Education Fork (if exists)
if [ -d "$REPO_ROOT/deploy/forks/education" ]; then
    echo "🎓 PHASE C: Deploying Education Fork..."
    cd "$REPO_ROOT/deploy/forks/education"
    docker-compose up -d --build
    sleep 10
    if curl -s -f http://localhost:8001/health > /dev/null 2>&1; then
        echo "✅ Education Fork operational"
    else
        echo "⚠️  Education Fork health check failed"
    fi
    echo ""
else
    echo "⏭️  PHASE C: Education Fork deployment files not found (skipping)"
    echo ""
fi

# PHASE D: Deploy Healthcare Fork (if exists)
if [ -d "$REPO_ROOT/deploy/forks/healthcare-nonclinical" ]; then
    echo "🏥 PHASE D: Deploying Healthcare Fork..."
    cd "$REPO_ROOT/deploy/forks/healthcare-nonclinical"
    docker-compose up -d --build
    sleep 10
    if curl -s -f http://localhost:8002/health > /dev/null 2>&1; then
        echo "✅ Healthcare Fork operational"
    else
        echo "⚠️  Healthcare Fork health check failed"
    fi
    echo ""
else
    echo "⏭️  PHASE D: Healthcare Fork deployment files not found (skipping)"
    echo ""
fi

# PHASE E: Deploy Analytics (if exists)
if [ -d "$REPO_ROOT/deploy/analytics" ]; then
    echo "📊 PHASE E: Deploying Analytics..."
    cd "$REPO_ROOT/deploy/analytics"
    docker-compose up -d
    sleep 5
    echo "✅ Analytics deployment attempted"
    echo ""
else
    echo "⏭️  PHASE E: Analytics deployment files not found (skipping)"
    echo ""
fi

# PHASE F: Deploy Frontend (if exists)
if [ -d "$REPO_ROOT/frontend/admin" ]; then
    echo "🌐 PHASE F: Frontend deployment..."
    echo "⚠️  Frontend requires manual deployment:"
    echo "    cd $REPO_ROOT/frontend/admin"
    echo "    npm install"
    echo "    npm run build"
    echo "    npm start"
    echo ""
else
    echo "⏭️  PHASE F: Frontend not found (skipping)"
    echo ""
fi

# PHASE G: Complete System Verification
echo "✅ PHASE G: Running system verification..."
cd "$REPO_ROOT/deploy"
if [ -f "full-health-check.sh" ]; then
    chmod +x full-health-check.sh
    ./full-health-check.sh
else
    echo "Health check script not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ACTIVATION SEQUENCE COMPLETE"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🌐 Access Points:"
echo "  Canonical Core: http://localhost:8000"
echo "  API Docs:       http://localhost:8000/docs"
echo "  Education Fork: http://localhost:8001 (if deployed)"
echo "  Healthcare Fork: http://localhost:8002 (if deployed)"
echo "  Analytics:      http://localhost:5000 (if deployed)"
echo "  Admin UI:       http://localhost:3000 (if deployed)"
echo ""
