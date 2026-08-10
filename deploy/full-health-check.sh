#!/bin/bash

echo "═══════════════════════════════════════════"
echo "  FRASBERG CORE v1.0.0 COMPLETE HEALTH CHECK"
echo "═══════════════════════════════════════════"
echo ""

check_service() {
    local name=$1
    local port=$2
    
    echo -n "Checking $name (port $port)... "
    if curl -s -f "http://localhost:${port}/health" > /dev/null 2>&1 || \
       curl -s -f "http://localhost:${port}" > /dev/null 2>&1; then
        echo "✅ HEALTHY"
        return 0
    else
        echo "❌ UNHEALTHY"
        return 1
    fi
}

check_service "Canonical Core     " 8000
check_service "Education Fork     " 8001
check_service "Healthcare Fork    " 8002
check_service "Analytics          " 5000
check_service "Frontend Admin UI  " 3000

echo ""
echo "═══════════════════════════════════════════"

# Check Docker containers
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "System status complete!"
