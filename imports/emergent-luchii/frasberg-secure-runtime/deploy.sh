#!/bin/bash
set -e

AWS_REGION="us-east-1"
ACCOUNT_ID="303004020510"
REPO="frasberg-secure-runtime"
CLUSTER="frasberg-secure-runtime-cluster"
SERVICE="frasberg-router-service"

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "🐳 Building Docker image..."
docker build -t $REPO .

echo "🏷 Tagging image..."
docker tag $REPO:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:latest

echo "⬆️ Pushing image to ECR..."
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO:latest

echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment \
  --region $AWS_REGION

echo "✅ Deployment triggered successfully."
