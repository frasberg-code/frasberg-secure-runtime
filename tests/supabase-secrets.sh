#!/usr/bin/env bash
set -euo pipefail

missing=0
for name in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  case "$name" in
    SUPABASE_URL) value="${SUPABASE_URL:-}" ;;
    SUPABASE_ANON_KEY) value="${SUPABASE_ANON_KEY:-}" ;;
    SUPABASE_SERVICE_ROLE_KEY) value="${SUPABASE_SERVICE_ROLE_KEY:-}" ;;
  esac

  if [[ -n "$value" ]]; then
    echo "$name: set"
  else
    echo "$name: missing"
    missing=1
  fi
done

if (( missing != 0 )); then
  exit 1
fi

echo "Supabase secret environment check passed; secret values were not displayed."
