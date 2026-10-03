#!/usr/bin/env bash
set -euo pipefail

GATEWAY_BASE_URL="${GATEWAY_BASE_URL:-http://127.0.0.1:4100}"
HEALTH_PATH="${GATEWAY_HEALTH_PATH:-/v1/health}"

curl --fail --silent --show-error --max-time 10 \
  "${GATEWAY_BASE_URL%/}${HEALTH_PATH}" >/dev/null
echo "Gateway-server health check passed."
