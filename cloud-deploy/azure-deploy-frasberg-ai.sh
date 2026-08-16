#!/bin/bash

echo "Deploying Frasberg to Microsoft Azure..."
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not installed"
    echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "✅ Azure CLI found"
echo ""

# Configuration
RESOURCE_GROUP="frasberg-rg"
LOCATION="eastus"
ACR_NAME="frasbergarireg"

echo "Azure Deployment Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Container Registry: $ACR_NAME"
echo ""

read -p "Continue with deployment? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 1: Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo ""
echo "Step 2: Creating container registry..."
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true

echo ""
echo "Step 3: Building and pushing images..."
cd ../..

# Login to ACR
az acr login --name $ACR_NAME

# Build and push
az acr build \
    --registry $ACR_NAME \
    --image frasberg/canonical-core:v1 \
    deploy/canonical-core

echo ""
echo "Step 4: Deploying to Azure Container Instances..."
az container create \
    --resource-group $RESOURCE_GROUP \
    --name frasberg-canonical-core \
    --image $ACR_NAME.azurecr.io/frasberg/canonical-core:v1 \
    --dns-name-label frasberg-canonical \
    --ports 8000 \
    --registry-login-server $ACR_NAME.azurecr.io \
    --registry-username $(az acr credential show --name $ACR_NAME --query username -o tsv) \
    --registry-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# Get FQDN
FQDN=$(az container show --resource-group $RESOURCE_GROUP --name frasberg-canonical-core --query ipAddress.fqdn -o tsv)

echo ""
echo "✅ Azure Deployment complete"
echo ""
echo "Service URLs:"
echo "  Canonical Core: http://$FQDN:8000"
echo ""
echo "Test deployment:"
echo "  curl http://$FQDN:8000/health"
echo ""
