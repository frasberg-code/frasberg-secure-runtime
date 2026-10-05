#!/usr/bin/env bash
set -euo pipefail

region="${AWS_REGION:-us-west-2}"
secret_name="${GOVERNANCE_ADMIN_SECRET_NAME:-frasberg/runtime/governance-admin}"
key="frb_live_governance_admin_$(openssl rand -hex 32)"

if aws secretsmanager describe-secret \
  --secret-id "$secret_name" \
  --region "$region" >/dev/null 2>&1; then
  echo "Secret '$secret_name' already exists; refusing to rotate it implicitly." >&2
  exit 1
fi

aws secretsmanager create-secret \
  --name "$secret_name" \
  --secret-string "$key" \
  --region "$region" \
  --query ARN \
  --output text
