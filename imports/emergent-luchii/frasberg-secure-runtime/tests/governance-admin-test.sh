#!/usr/bin/env bash
set -euo pipefail

: "${GOVERNANCE_BASE_URL:?Set GOVERNANCE_BASE_URL}"
: "${GOVERNANCE_ADMIN_KEY:?Set GOVERNANCE_ADMIN_KEY}"

curl --fail-with-body --silent --show-error \
  -H "x-governance-key: ${GOVERNANCE_ADMIN_KEY}" \
  "${GOVERNANCE_BASE_URL%/}/v1/governance/diagnostics"
