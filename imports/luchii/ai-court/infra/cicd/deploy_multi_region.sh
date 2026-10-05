#!/bin/bash
set -e

TAG=${1:-latest}
REGIONS=("us-west-2" "us-east-1" "eu-central-1")

echo "🚀 Deploying AI Court to all regions with tag: $TAG"

for region in "${REGIONS[@]}"; do
  echo "📦 Deploying to region: $region"

  aws eks update-kubeconfig --name ai-court-$region --region $region

  helm upgrade --install ai-court frasberg/luchii \
    --namespace default \
    --values ./infra/helm/values.yaml \
    --values ./infra/helm/values-$region.yaml \
    --set image.tag=$TAG \
    --wait

  echo "✅ Deployment complete in $region"
done

echo "🎉 All regions deployed successfully!"
