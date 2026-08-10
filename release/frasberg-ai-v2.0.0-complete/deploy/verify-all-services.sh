#!/bin/bash

echo "══════════════════════════════════════════════════"
echo "  FRASBERG CORE v1.0.0 - COMPLETE SYSTEM VERIFICATION"
echo "══════════════════════════════════════════════════"
echo ""

check_service() {
    local name="$1"
    local port=$2
    local endpoint="${3:-/health}"
    
    echo -n "Checking $name (port $port)... "
    
    if curl -s -f "http://localhost:${port}${endpoint}" > /dev/null 2>&1; then
        echo "✅ HEALTHY"
        return 0
    else
        echo "❌ OFFLINE"
        return 1
    fi
}

echo "SERVICE HEALTH CHECKS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_service "Canonical Core     " 8000 "/health"
check_service "Education Fork     " 8001 "/health"
check_service "Healthcare Fork    " 8002 "/health"
check_service "Analytics Dashboard" 5000 "/health"
check_service "Frontend Admin UI  " 3000 "/"

echo ""
echo "DOCKER CONTAINERS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "QUICK API TESTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Canonical Core:"
curl -s http://localhost:8000/ | python3 -m json.tool | head -5

echo ""
echo "Education Fork:"
curl -s http://localhost:8001/ | python3 -m json.tool | head -5

echo ""
echo "Healthcare Fork:"
curl -s http://localhost:8002/ | python3 -m json.tool | head -5

echo ""
echo "Analytics:"
curl -s http://localhost:5000/ | python3 -m json.tool | head -5

echo ""
echo "══════════════════════════════════════════════════"
echo "  ACCESS POINTS"
echo "══════════════════════════════════════════════════"
echo ""
echo "  🌐 Frontend Admin UI:  http://localhost:3000"
echo "  📊 Canonical Core:     http://localhost:8000/docs"
echo "  🎓 Education Fork:     http://localhost:8001/docs"
echo "  🏥 Healthcare Fork:    http://localhost:8002/docs"
echo "  📈 Analytics:          http://localhost:5000/docs"
echo ""
echo "══════════════════════════════════════════════════"
