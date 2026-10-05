#!/usr/bin/env bash
set -euo pipefail

: "${TASK_SECURITY_GROUP_ID:?Set TASK_SECURITY_GROUP_ID to the ECS task security group ID}"
: "${ALB_SECURITY_GROUP_ID:?Set ALB_SECURITY_GROUP_ID to the load balancer security group ID}"

AWS_REGION="${AWS_REGION:-us-west-2}"
CONTAINER_PORT="${CONTAINER_PORT:-4000}"

if [[ ! "$CONTAINER_PORT" =~ ^[0-9]+$ ]] || (( CONTAINER_PORT < 1 || CONTAINER_PORT > 65535 )); then
  echo "CONTAINER_PORT must be an integer from 1 to 65535." >&2
  exit 2
fi

aws ec2 authorize-security-group-ingress \
  --group-id "$TASK_SECURITY_GROUP_ID" \
  --protocol tcp \
  --port "$CONTAINER_PORT" \
  --source-group "$ALB_SECURITY_GROUP_ID" \
  --region "$AWS_REGION"
