#!/usr/bin/env bash
set -euo pipefail

: "${FRASBERG_API_KEY:?Set FRASBERG_API_KEY}"

curl \
  -H "x-api-key: ${FRASBERG_API_KEY}" \
  -H "x-tenant-id: demo" \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}' \
  http://127.0.0.1:4000/v1/chat/completions
