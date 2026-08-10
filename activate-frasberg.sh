#!/bin/bash

# =============================================================================
# FRASBERG Core Activation Script
# =============================================================================
# This script activates and verifies the FRASBERG Core Backend system
# =============================================================================

set -e

echo "🚀 Activating FRASBERG Core Backend..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create it from .env.example:"
    echo "  cp .env.example .env"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Verify required FRASBERG variables
echo "🔍 Verifying FRASBERG Model Configuration..."
echo ""

if [ -z "$FRASBERG_MODEL_ENDPOINT" ]; then
    echo -e "${RED}❌ FRASBERG_MODEL_ENDPOINT not set${NC}"
    exit 1
else
    echo -e "${GREEN}✅ FRASBERG_MODEL_ENDPOINT: $FRASBERG_MODEL_ENDPOINT${NC}"
fi

if [ -z "$FRASBERG_MODEL_API_KEY" ]; then
    echo -e "${RED}❌ FRASBERG_MODEL_API_KEY not set${NC}"
    exit 1
else
    echo -e "${GREEN}✅ FRASBERG_MODEL_API_KEY: ${FRASBERG_MODEL_API_KEY:0:20}...${NC}"
fi

if [ -z "$MODEL_ENDPOINT" ]; then
    echo -e "${YELLOW}⚠️  MODEL_ENDPOINT not set${NC}"
else
    echo -e "${GREEN}✅ MODEL_ENDPOINT: $MODEL_ENDPOINT${NC}"
fi

if [ -z "$MODEL_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  MODEL_API_KEY not set${NC}"
else
    echo -e "${GREEN}✅ MODEL_API_KEY: ${MODEL_API_KEY:0:20}...${NC}"
fi

echo ""
echo "🔍 Verifying Project Configuration..."
echo ""

if [ -z "$PROJECT_URL" ]; then
    echo -e "${YELLOW}⚠️  PROJECT_URL not set${NC}"
else
    echo -e "${GREEN}✅ PROJECT_URL: $PROJECT_URL${NC}"
fi

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SERVICE_ROLE_KEY not set${NC}"
else
    echo -e "${GREEN}✅ SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:0:20}...${NC}"
fi

echo ""
echo "🔍 Verifying GitHub Integration (Optional)..."
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not set (optional)${NC}"
else
    echo -e "${GREEN}✅ GITHUB_TOKEN: ${GITHUB_TOKEN:0:15}...${NC}"
fi

if [ -z "$GITHUB_REPO_URL" ]; then
    echo -e "${YELLOW}⚠️  GITHUB_REPO_URL not set (optional)${NC}"
else
    echo -e "${GREEN}✅ GITHUB_REPO_URL: $GITHUB_REPO_URL${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ FRASBERG Core Backend is ACTIVE and CONFIGURED! ✨${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Reference:"
echo ""
echo "  Model Endpoint:"
echo "    $FRASBERG_MODEL_ENDPOINT"
echo ""
echo "  Supabase Project:"
echo "    $PROJECT_URL"
echo ""
echo "  GitHub Repository:"
echo "    $GITHUB_REPO_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Next Steps:"
echo ""
echo "  1. Deploy Supabase Functions:"
echo "     supabase functions deploy"
echo ""
echo "  2. Configure Vault Secrets (production):"
echo "     ./setup-frasberg-secrets.sh"
echo ""
echo "  3. Test the endpoint:"
echo "     curl -X POST $FRASBERG_MODEL_ENDPOINT \\"
echo "       -H 'Authorization: Bearer $FRASBERG_MODEL_API_KEY' \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"message\": \"Hello FRASBERG\"}'"
echo ""
echo "  4. Start backend server (if needed):"
echo "     cd backend && python server.py"
echo ""
echo "  5. Start voice gateway (if needed):"
echo "     cd voice-gateway && npm start"
echo ""
echo "  6. View documentation:"
echo "     - SECRETS_SETUP.md - Secrets management guide"
echo "     - README.md - Main documentation"
echo "     - MIGRATION_GUIDE.md - Migration instructions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
