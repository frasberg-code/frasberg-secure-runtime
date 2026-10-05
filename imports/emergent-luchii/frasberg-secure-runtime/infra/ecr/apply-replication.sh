#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-2}"
CONFIG="${1:-infra/ecr/replication.json}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
RENDERED_CONFIG="$(mktemp)"
trap 'rm -f "$RENDERED_CONFIG"' EXIT

jq --arg account "$ACCOUNT_ID" \
  '(.replicationConfiguration.rules[].destinations[].registryId) = $account' \
  "$CONFIG" > "$RENDERED_CONFIG"

aws ecr put-replication-configuration \
  --cli-input-json "file://$RENDERED_CONFIG" \
  --region "$AWS_REGION"
