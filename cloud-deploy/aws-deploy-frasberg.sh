#!/bin/bash

echo "Deploying Frasberg to AWS..."
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not installed"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Configuration
REGION="us-east-1"
CLUSTER_NAME="frasberg-prod"
ECR_REPO="frasberg"

echo "AWS Deployment Configuration:"
echo "  Region: $REGION"
echo "  Cluster: $CLUSTER_NAME"
echo "  ECR Repo: $ECR_REPO"
echo ""

read -p "Continue with deployment? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 1: Creating ECR repositories..."
for service in canonical-core education-fork healthcare-fork analytics; do
    aws ecr create-repository \
        --repository-name frasberg/$service \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true 2>/dev/null || echo "Repository frasberg-ai/$service already exists"
done

echo ""
echo "Step 2: Building and pushing Docker images..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URL

# Build and push images
cd ../..
for service in canonical-core; do
    echo "Building $service..."
    docker build -t frasberg-ai/$service:v1 -f deploy/$service/Dockerfile .
    docker tag frasberg-ai/$service:v1 $ECR_URL/frasberg-ai/$service:v1
    docker push $ECR_URL/frasberg-ai/$service:v1
done

echo ""
echo "Step 3: Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --region $REGION 2>/dev/null || echo "Cluster already exists"

echo ""
echo "Step 4: Creating task definitions..."
# Create task definition JSON files here

echo ""
echo "✅ AWS Deployment initiated"
echo ""
echo "Next steps:"
echo "  1. Configure load balancer"
echo "  2. Set up DNS (Route 53)"
echo "  3. Configure auto-scaling"
echo "  4. Set up monitoring (CloudWatch)"
echo ""
echo "Access URLs will be available after load balancer setup"
