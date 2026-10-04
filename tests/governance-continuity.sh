#!/usr/bin/env bash
set -euo pipefail

: "${GOVERNANCE_BASE_URL:?Set GOVERNANCE_BASE_URL, for example https://runtime.aws.frasberg.com}"
: "${GOVERNANCE_API_KEY:?Set GOVERNANCE_API_KEY with the governance:admin permission}"
curl --fail-with-body --silent --show-error \
  -H "x-api-key: ${GOVERNANCE_API_KEY}" \
  "${GOVERNANCE_BASE_URL%/}/v1/governance/continuity"
