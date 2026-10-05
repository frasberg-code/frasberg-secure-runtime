#!/usr/bin/env bash
set -euo pipefail

CONFIG="${1:-infra/ecs/autoscaling.json}"
AWS_REGION="${AWS_REGION:-$(jq -r '.region' "$CONFIG")}"
CLUSTER="$(jq -r '.cluster' "$CONFIG")"
SERVICE="$(jq -r '.service' "$CONFIG")"
MIN_CAPACITY="$(jq -r '.minCapacity' "$CONFIG")"
MAX_CAPACITY="$(jq -r '.maxCapacity' "$CONFIG")"
RESOURCE_ID="service/${CLUSTER}/${SERVICE}"

aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --region "$AWS_REGION" \
  --query 'services[?status==`ACTIVE`].serviceName' \
  --output text | grep -Fxq "$SERVICE" || {
    echo "Active ECS service '$SERVICE' was not found in '$CLUSTER' ($AWS_REGION)." >&2
    exit 1
  }

aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "$RESOURCE_ID" \
  --min-capacity "$MIN_CAPACITY" \
  --max-capacity "$MAX_CAPACITY" \
  --region "$AWS_REGION"

while IFS=$'\t' read -r name metric target; do
  policy_config="$(jq -cn \
    --arg metric "$metric" \
    --argjson target "$target" \
    '{TargetValue:$target,PredefinedMetricSpecification:{PredefinedMetricType:$metric},ScaleOutCooldown:60,ScaleInCooldown:300}')"
  aws application-autoscaling put-scaling-policy \
    --policy-name "$name" \
    --policy-type TargetTrackingScaling \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id "$RESOURCE_ID" \
    --target-tracking-scaling-policy-configuration "$policy_config" \
    --region "$AWS_REGION"
done < <(jq -r '.policies[] | [.name, .metric, .targetValue] | @tsv' "$CONFIG")
