#!/bin/bash

REGIONS=("us-west-2" "us-east-1" "eu-central-1")

for REGION in "${REGIONS[@]}"; do
  aws ecs update-service \
    --cluster frasberg-runtime-cluster \
    --service frasberg-secure-runtime \
    --force-new-deployment \
    --region $REGION
done
