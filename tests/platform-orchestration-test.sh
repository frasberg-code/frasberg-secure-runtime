#!/bin/bash
set -euo pipefail

RUNTIME_BASE_URL="${RUNTIME_BASE_URL:-}"
if [[ -z "$RUNTIME_BASE_URL" ]]; then
  : "${ALB_DNS:?Set RUNTIME_BASE_URL or ALB_DNS}"
  RUNTIME_BASE_URL="https://${ALB_DNS}"
fi

echo 'Testing platform orchestration...'
curl --fail --silent --show-error --max-time 10 \
  "${RUNTIME_BASE_URL%/}/engine/worldgraph/ping"
