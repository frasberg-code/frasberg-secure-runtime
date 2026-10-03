#!/usr/bin/env bash
set -euo pipefail

ROUTER_BASE_URL="${ROUTER_BASE_URL:-http://127.0.0.1:4001}"
HEALTH_PATH="${ROUTER_HEALTH_PATH:-/health}"

curl --fail --silent --show-error --max-time 10 \
  "${ROUTER_BASE_URL%/}${HEALTH_PATH}" >/dev/null
echo "Runtime-router health check passed."
