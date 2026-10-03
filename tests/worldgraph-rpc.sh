#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY}"
: "${SUPABASE_ACCESS_TOKEN:?Set a Supabase user access token; do not use the service-role key}"

SUPABASE_URL="${SUPABASE_URL%/}"

umask 077
curl_config="$(mktemp)"
trap 'rm -f "$curl_config"' EXIT
printf 'header = "apikey: %s"\nheader = "Authorization: Bearer %s"\n' \
  "$SUPABASE_ANON_KEY" \
  "$SUPABASE_ACCESS_TOKEN" >"$curl_config"

http_status="$(curl --silent --show-error --max-time 20 \
  --config "$curl_config" \
  --output /dev/null \
  --write-out '%{http_code}' \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"p_owner_id":null,"p_limit":1,"p_offset":0}' \
  "$SUPABASE_URL/rest/v1/rpc/rpc_list_worldgraph_definitions")"

if [[ "$http_status" != "200" ]]; then
  echo "WorldGraph RPC health request failed with HTTP $http_status." >&2
  exit 1
fi

echo "WorldGraph RPC health check passed."
