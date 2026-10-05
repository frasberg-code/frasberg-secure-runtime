#!/bin/bash
set -e

TAG=${1:-latest}
REGISTRY="gcr.io/frasberg"

SERVICES=(
  "case-service"
  "evidence-service"
  "law-service"
  "integrity-service"
  "audit-governance-service"
  "user-role-service"
  "gateway"
)

echo "🏗️ Building and pushing Docker images with tag: $TAG"

for service in "${SERVICES[@]}"; do
  echo "📦 Building $service..."

  docker build \
    -t $REGISTRY/ai-court:$service-$TAG \
    -t $REGISTRY/ai-court:$service-latest \
    ./ai-court/services/$service

  echo "🚀 Pushing $service to registry..."
  docker push $REGISTRY/ai-court:$service-$TAG
  docker push $REGISTRY/ai-court:$service-latest

  echo "✅ $service pushed successfully"
done

echo "🎉 All images built and pushed successfully!"
