#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-2}"
ECS_CLUSTER="${ECS_CLUSTER:-frasberg-secure-runtime-cluster}"

status="$(aws ecs describe-clusters \
  --clusters "$ECS_CLUSTER" \
  --region "$AWS_REGION" \
  --query 'clusters[0].status' \
  --output text)"

if [[ "$status" == "ACTIVE" ]]; then
  echo "ECS cluster '$ECS_CLUSTER' is already active in $AWS_REGION."
  exit 0
fi

aws ecs create-cluster \
  --cluster-name "$ECS_CLUSTER" \
  --region "$AWS_REGION"
