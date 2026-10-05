#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-}"
if [[ -z "${TARGET_ENV}" ]]; then
  echo "Usage: scripts/deploy.sh <development|staging|production>"
  exit 1
fi

if [[ -z "${FRASBERGAI_API_KEY:-}" ]]; then
  echo "Missing FRASBERGAI_API_KEY"
  exit 1
fi

if [[ -z "${FRASBERGAI_MODEL_TOKEN:-}" ]]; then
  echo "Missing FRASBERGAI_MODEL_TOKEN"
  exit 1
fi

if [[ -z "${FRASBERGAI_DB_URL:-}" ]]; then
  echo "Missing FRASBERGAI_DB_URL"
  exit 1
fi

case "${TARGET_ENV}" in
  development)
    if [[ -z "${FRASBERGAI_DEV_DEPLOY_KEY:-}" ]]; then
      echo "Missing FRASBERGAI_DEV_DEPLOY_KEY"
      exit 1
    fi
    ;;
  staging)
    if [[ -z "${FRASBERGAI_STAGING_DEPLOY_KEY:-}" ]]; then
      echo "Missing FRASBERGAI_STAGING_DEPLOY_KEY"
      exit 1
    fi
    ;;
  production)
    if [[ -z "${FRASBERGAI_DEPLOY_KEY:-}" ]]; then
      echo "Missing FRASBERGAI_DEPLOY_KEY"
      exit 1
    fi
    ;;
  *)
    echo "Unknown environment: ${TARGET_ENV}"
    exit 1
    ;;
esac

echo "Deploying FrasbergAI backend to ${TARGET_ENV}..."
# Replace this stub with your actual deployment command.
# Example: helm upgrade --install luchii ./helm/luchii -f ./helm/luchii/values.yaml
