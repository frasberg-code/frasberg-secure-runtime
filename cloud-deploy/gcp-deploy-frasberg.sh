#!/bin/bash

echo "Deploying Frasberg to Google Cloud Platform..."
echo ""

# Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI found"
echo ""

# Configuration
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="us-central1"

if [ -z "$PROJECT_ID" ]; then
    echo "⚠️  No GCP project configured"
    read -p "Enter GCP Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo "GCP Deployment Configuration:"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo ""

read -p "Continue with deployment? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 1: Enabling required APIs..."
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID

echo ""
echo "Step 2: Building and pushing container images..."
cd ../..

# Build and submit to Cloud Build
gcloud builds submit \
    --tag gcr.io/$PROJECT_ID/frasberg/canonical-core:v1 \
    --project=$PROJECT_ID \
    deploy/canonical-core

echo ""
echo "Step 3: Deploying to Cloud Run..."
gcloud run deploy frasberg-canonical-core \
    --image gcr.io/$PROJECT_ID/frasberg-ai/canonical-core:v1 \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8000 \
    --project=$PROJECT_ID

# Get URL
CANONICAL_URL=$(gcloud run services describe frasberg-canonical-core --platform managed --region $REGION --format 'value(status.url)' --project=$PROJECT_ID)

echo ""
echo "✅ GCP Deployment complete"
echo ""
echo "Service URLs:"
echo "  Canonical Core: $CANONICAL_URL"
echo ""
echo "Test deployment:"
echo "  curl $CANONICAL_URL/health"
echo ""
