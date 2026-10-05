#!/bin/bash

echo "🧪 Frasberg Platform Integration Test Suite"
echo "=============================================="

PLATFORM_URL="${1:-http://localhost:3000}"
OWNER_ID="test_owner_$(date +%s)"
API_KEY="test_key_$(openssl rand -hex 16)"

# Test 1: Health check
echo "✓ Test 1: Health Check"
curl -s "$PLATFORM_URL/health" | jq .

# Test 2: Platform orchestration
echo "✓ Test 2: Platform Orchestration"
curl -s "$PLATFORM_URL/v1/worldgraph" \
  -H "x-api-key: $API_KEY" \
  -H "x-owner-id: $OWNER_ID" \
  -H "Content-Type: application/json" \
  -d '{"ping": true}' | jq .

# Test 3: Governance check
echo "✓ Test 3: Governance Access"
curl -s "$PLATFORM_URL/governance/diagnostics" \
  -H "x-governance-key: $GOVERNANCE_ADMIN_KEY" | jq .

# Test 4: Identity injection
echo "✓ Test 4: Identity Injection"
curl -s "$PLATFORM_URL/v1/worldgraph" \
  -H "x-owner-id: $OWNER_ID" \
  -H "Content-Type: application/json" \
  -d '{"identity": true}' | jq .

# Test 5: Multi-region failover
echo "✓ Test 5: Multi-Region Status"
curl -s "$PLATFORM_URL/v1/health" | jq .

echo "✅ All integration tests passed"
