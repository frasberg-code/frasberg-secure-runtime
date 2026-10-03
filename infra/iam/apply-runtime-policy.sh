#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-2}"
ROLE_NAME="${ECS_EXECUTION_ROLE_NAME:-ecsTaskExecutionRole}"
POLICY_NAME="${ECS_EXECUTION_POLICY_NAME:-FrasbergSecureRuntime}"
ACCOUNT_ID="$(aws sts get-caller-identity \
  --region "$AWS_REGION" \
  --query Account \
  --output text)"

if [[ ! "$ACCOUNT_ID" =~ ^[0-9]{12}$ ]]; then
  echo "Could not determine a valid AWS account ID." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
policy_template="$script_dir/frasberg-secure-runtime-role.json"
policy_file="$(mktemp)"
trap 'rm -f "$policy_file"' EXIT
umask 077

sed "s/__AWS_ACCOUNT_ID__/$ACCOUNT_ID/g" "$policy_template" >"$policy_file"

policy_uri="file://$policy_file"
if command -v cygpath >/dev/null 2>&1; then
  policy_uri="file://$(cygpath -w "$policy_file")"
fi

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$policy_uri" \
  --region "$AWS_REGION"

echo "Applied '$POLICY_NAME' to IAM role '$ROLE_NAME' in $AWS_REGION."
