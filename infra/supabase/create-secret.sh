#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"

AWS_REGION="${AWS_REGION:-us-west-2}"
SECRET_NAME="${SUPABASE_SECRET_NAME:-frasberg/supabase/runtime}"

command -v jq >/dev/null 2>&1 || {
  echo "jq is required to safely construct the secret JSON." >&2
  exit 127
}

umask 077
secret_file="$(mktemp)"
trap 'rm -f "$secret_file"' EXIT

jq -n \
  'env | {SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY}' \
  >"$secret_file"

if aws secretsmanager describe-secret \
  --secret-id "$SECRET_NAME" \
  --region "$AWS_REGION" >/dev/null 2>&1; then
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_NAME" \
    --secret-string "file://$secret_file" \
    --region "$AWS_REGION" >/dev/null
  echo "Updated secret '$SECRET_NAME' in $AWS_REGION."
else
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --secret-string "file://$secret_file" \
    --region "$AWS_REGION" >/dev/null
  echo "Created secret '$SECRET_NAME' in $AWS_REGION."
fi
