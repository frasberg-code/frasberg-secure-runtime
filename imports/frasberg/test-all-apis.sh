#!/bin/bash

echo "════════════════════════════════════════════════"
echo "  FRASBERG CORE v1.0.0 - COMPREHENSIVE API TESTING"
echo "════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

test_endpoint() {
    local name="$1"
    local url="$2"
    
    echo -e "${BLUE}Testing:${NC} $name"
    echo "URL: $url"
    curl -s "$url" | python3 -m json.tool 2>/dev/null || curl -s "$url"
    echo ""
    echo "────────────────────────────────────────────────"
    echo ""
}

echo -e "${GREEN}═══ CANONICAL CORE TESTS ═══${NC}"
echo ""
test_endpoint "Root Endpoint" "http://localhost:8000/"
test_endpoint "Health Check" "http://localhost:8000/health"
test_endpoint "API Status" "http://localhost:8000/api/v1/status"

echo -e "${GREEN}═══ EDUCATION FORK TESTS ═══${NC}"
echo ""
test_endpoint "Education Root" "http://localhost:8001/"
test_endpoint "Education Health" "http://localhost:8001/health"
test_endpoint "Available Personas" "http://localhost:8001/api/v1/personas"
test_endpoint "Available Simulations" "http://localhost:8001/api/v1/simulations"
test_endpoint "Fork Status" "http://localhost:8001/api/v1/status"

echo -e "${GREEN}═══ HEALTHCARE FORK TESTS ═══${NC}"
echo ""
test_endpoint "Healthcare Root" "http://localhost:8002/"
test_endpoint "Healthcare Health" "http://localhost:8002/health"
test_endpoint "Healthcare Personas" "http://localhost:8002/api/v1/personas"
test_endpoint "Healthcare Simulations" "http://localhost:8002/api/v1/simulations"
test_endpoint "Scope Limits" "http://localhost:8002/api/v1/scope-limits"
test_endpoint "Healthcare Status" "http://localhost:8002/api/v1/status"

echo -e "${GREEN}═══ ANALYTICS TESTS ═══${NC}"
echo ""
test_endpoint "Analytics Root" "http://localhost:5000/"
test_endpoint "Analytics Health" "http://localhost:5000/health"
test_endpoint "System Metrics" "http://localhost:5000/api/v1/metrics"
test_endpoint "Usage Statistics" "http://localhost:5000/api/v1/usage"
test_endpoint "Analytics Status" "http://localhost:5000/api/v1/status"

echo "════════════════════════════════════════════════"
echo "  ✅ API TESTING COMPLETE"
echo "════════════════════════════════════════════════"
echo ""
echo "Interactive API Documentation:"
echo "  • Canonical Core:  http://localhost:8000/docs"
echo "  • Education Fork:  http://localhost:8001/docs"
echo "  • Healthcare Fork: http://localhost:8002/docs"
echo "  • Analytics:       http://localhost:5000/docs"
echo ""
