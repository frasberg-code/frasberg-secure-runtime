#!/usr/bin/env bash
set -euo pipefail

HEALTH_URL="${PRODUCTION_HEALTH_URL:-https://runtime.aws.frasberg.com/health}"

curl --fail --silent --show-error --max-time 15 "$HEALTH_URL" >/dev/null
echo "Production health check passed: $HEALTH_URL"
