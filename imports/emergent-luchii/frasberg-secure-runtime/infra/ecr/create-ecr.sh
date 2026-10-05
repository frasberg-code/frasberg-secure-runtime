#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-west-2}"
ECR_REPOSITORY="${ECR_REPOSITORY:-frasberg-secure-runtime}"

if aws ecr describe-repositories \
  --repository-names "$ECR_REPOSITORY" \
  --region "$AWS_REGION" >/dev/null 2>&1; then
  echo "ECR repository '$ECR_REPOSITORY' already exists in $AWS_REGION."
  exit 0
fi

aws ecr create-repository \
  --repository-name "$ECR_REPOSITORY" \
  --image-scanning-configuration scanOnPush=true \
  --region "$AWS_REGION"
