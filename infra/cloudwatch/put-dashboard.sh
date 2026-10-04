#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-2}"
DASHBOARD_NAME="${DASHBOARD_NAME:-frasberg-secure-runtime}"

aws cloudwatch put-dashboard \
  --dashboard-name "$DASHBOARD_NAME" \
  --dashboard-body "file://infra/cloudwatch/dashboard.json" \
  --region "$AWS_REGION"
