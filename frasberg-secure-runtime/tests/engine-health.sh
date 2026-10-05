#!/usr/bin/env bash
set -euo pipefail

ENGINE_BASE_URL="${ENGINE_BASE_URL:-http://127.0.0.1:4002}"
HEALTH_PATH="${ENGINE_HEALTH_PATH:-/v1/health}"

curl --fail --silent --show-error --max-time 10 \
  "${ENGINE_BASE_URL%/}${HEALTH_PATH}" >/dev/null
echo "Engine health check passed."
