#!/bin/bash

echo "════════════════════════════════════════════════"
echo "  FRASBERG CORE v1.0.0 - CLOUD DEPLOYMENT"
echo "════════════════════════════════════════════════"
echo ""

echo "Select cloud provider:"
echo "1) AWS (Amazon Web Services)"
echo "2) GCP (Google Cloud Platform)"
echo "3) Azure (Microsoft Azure)"
echo "4) All clouds (multi-cloud deployment)"
echo "5) Generate deployment configurations only"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "═══ AWS DEPLOYMENT ═══"
        echo ""
        ./cloud-deploy/aws-deploy-frasberg-ai.sh
        ;;
    2)
        echo ""
        echo "═══ GCP DEPLOYMENT ═══"
        echo ""
        ./cloud-deploy/gcp-deploy-frasberg-ai.sh
        ;;
    3)
        echo ""
        echo "═══ AZURE DEPLOYMENT ═══"
        echo ""
        ./cloud-deploy/azure-deploy-frasberg-ai.sh
        ;;
    4)
        echo ""
        echo "═══ MULTI-CLOUD DEPLOYMENT ═══"
        echo ""
        ./cloud-deploy/aws-deploy-frasberg-ai.sh
        ./cloud-deploy/gcp-deploy-frasberg-ai.sh
        ./cloud-deploy/azure-deploy-frasberg-ai.sh
        ;;
    5)
        echo ""
        echo "═══ GENERATING CLOUD CONFIGURATIONS ═══"
        echo ""
        echo "Cloud configuration templates are available in CLOUD_DEPLOYMENT.md"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ CLOUD DEPLOYMENT PROCESS COMPLETE"
echo "════════════════════════════════════════════════"
