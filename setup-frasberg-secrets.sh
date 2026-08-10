#!/bin/bash

# =============================================================================
# FRASBERG Core Backend - Secrets Configuration Script
# =============================================================================
# This script helps configure FRASBERG Model endpoint secrets in Supabase Vault
# 
# Prerequisites:
# - Supabase CLI installed (https://supabase.com/docs/guides/cli)
# - Project linked: supabase link --project-ref YOUR_PROJECT_REF
# =============================================================================

set -e

echo "🔐 Setting up FRASBERG Model Endpoint Secrets..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Supabase project not linked. Please run:"
    echo "   supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Read from .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Source the .env file
export $(grep -v '^#' .env | xargs)

echo "📝 Configuring Supabase Vault Secrets..."
echo ""

# Set FRASBERG Model secrets in Supabase Vault
if [ -n "$FRASBERG_MODEL_ENDPOINT" ]; then
    echo "✅ Setting FRASBERG_MODEL_ENDPOINT..."
    supabase secrets set FRASBERG_MODEL_ENDPOINT="$FRASBERG_MODEL_ENDPOINT"
else
    echo "⚠️  FRASBERG_MODEL_ENDPOINT not found in .env"
fi

if [ -n "$FRASBERG_MODEL_API_KEY" ]; then
    echo "✅ Setting FRASBERG_MODEL_API_KEY..."
    supabase secrets set FRASBERG_MODEL_API_KEY="$FRASBERG_MODEL_API_KEY"
else
    echo "⚠️  FRASBERG_MODEL_API_KEY not found in .env"
fi

# Set MODEL_ENDPOINT and MODEL_API_KEY for Edge Functions
if [ -n "$MODEL_ENDPOINT" ]; then
    echo "✅ Setting MODEL_ENDPOINT..."
    supabase secrets set MODEL_ENDPOINT="$MODEL_ENDPOINT"
else
    echo "⚠️  MODEL_ENDPOINT not found in .env"
fi

if [ -n "$MODEL_API_KEY" ]; then
    echo "✅ Setting MODEL_API_KEY..."
    supabase secrets set MODEL_API_KEY="$MODEL_API_KEY"
else
    echo "⚠️  MODEL_API_KEY not found in .env"
fi

# Set GitHub integration secrets (optional)
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✅ Setting GITHUB_TOKEN..."
    supabase secrets set GITHUB_TOKEN="$GITHUB_TOKEN"
fi

if [ -n "$GITHUB_REPO_URL" ]; then
    echo "✅ Setting GITHUB_REPO_URL..."
    supabase secrets set GITHUB_REPO_URL="$GITHUB_REPO_URL"
fi

echo ""
echo "✨ Secrets configuration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify secrets: supabase secrets list"
echo "   2. Deploy functions: supabase functions deploy"
echo "   3. Test endpoint: curl -X POST $FRASBERG_MODEL_ENDPOINT"
echo ""
