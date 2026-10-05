#!/usr/bin/env bash
set -euo pipefail

CONFIG="${1:-infra/ecs/multi-region-clusters.json}"

while IFS=$'\t' read -r region cluster; do
  status="$(aws ecs describe-clusters \
    --clusters "$cluster" \
    --region "$region" \
    --query 'clusters[0].status' \
    --output text)"
  if [[ "$status" != "ACTIVE" ]]; then
    aws ecs create-cluster --cluster-name "$cluster" --region "$region"
  else
    echo "ECS cluster '$cluster' is already active in $region."
  fi
done < <(jq -r '.regions[] | [.region, .cluster] | @tsv' "$CONFIG")
