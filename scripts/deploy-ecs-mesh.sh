#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="${CLUSTER_NAME:-frasberg-secure-runtime-cluster}"
ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "$ACCOUNT_ID" ]]; then
  echo "AWS_ACCOUNT_ID is required to deploy the Frasberg ECS mesh." >&2
  exit 1
fi

node ./scripts/generate-ecs-mesh-manifest.mjs >/dev/null

python - <<'PY'
import json
from pathlib import Path
manifest = json.loads(Path('manifests/frasberg-ecs-mesh.json').read_text())
for svc in manifest['services']:
    print(svc['service'])
PY

while IFS= read -r svc; do
  task_family="frasberg-${svc}-task"
  service_name="frasberg-${svc}-service"
  container_name="frasberg-${svc}-container"

  task_payload=$(python - <<PY
import json
from pathlib import Path
manifest = json.loads(Path('manifests/frasberg-ecs-mesh.json').read_text())
svc_name = "${svc}"
for item in manifest['services']:
    if item['service'] == svc_name:
        print(json.dumps(item['taskDefinition']))
        break
PY
)

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] aws ecs register-task-definition --region "$AWS_REGION" --family "$task_family" --network-mode awsvpc --requires-compatibilities FARGATE --cpu 256 --memory 512 --execution-role-arn arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole --task-role-arn arn:aws:iam::${ACCOUNT_ID}:role/frasberg-runtime-role --container-definitions '$task_payload'"
    echo "[dry-run] aws ecs create-service --region "$AWS_REGION" --cluster "$CLUSTER_NAME" --service-name "$service_name" --launch-type FARGATE --desired-count 2 --task-definition "$task_family" --network-configuration "awsvpcConfiguration={subnets=[subnet-private-compute-a,subnet-private-compute-b],securityGroups=[sg-frasberg-${svc}],assignPublicIp=DISABLED}" --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:${AWS_REGION}:$ACCOUNT_ID:targetgroup/frasberg-${svc}-tg/<TG_ID>,containerName=${container_name},containerPort=80""
    continue
  fi

  aws ecs register-task-definition \
    --region "$AWS_REGION" \
    --family "$task_family" \
    --network-mode awsvpc \
    --requires-compatibilities FARGATE \
    --cpu 256 \
    --memory 512 \
    --execution-role-arn "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole" \
    --task-role-arn "arn:aws:iam::${ACCOUNT_ID}:role/frasberg-runtime-role" \
    --container-definitions "$task_payload" >/dev/null

  if ! aws ecs describe-services --region "$AWS_REGION" --cluster "$CLUSTER_NAME" --services "$service_name" >/dev/null 2>&1; then
    aws ecs create-service \
      --region "$AWS_REGION" \
      --cluster "$CLUSTER_NAME" \
      --service-name "$service_name" \
      --task-definition "$task_family" \
      --desired-count 2 \
      --launch-type FARGATE \
      --network-configuration "awsvpcConfiguration={subnets=[subnet-private-compute-a,subnet-private-compute-b],securityGroups=[sg-frasberg-${svc}],assignPublicIp=DISABLED}" \
      --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:${AWS_REGION}:${ACCOUNT_ID}:targetgroup/frasberg-${svc}-tg/<TG_ID>,containerName=${container_name},containerPort=80" >/dev/null
  else
    aws ecs update-service \
      --region "$AWS_REGION" \
      --cluster "$CLUSTER_NAME" \
      --service "$service_name" \
      --task-definition "$task_family" \
      --desired-count 2 >/dev/null
  fi

done < <(node - <<'NODE'
const manifest = JSON.parse(require('fs').readFileSync('manifests/frasberg-ecs-mesh.json', 'utf8'));
for (const svc of manifest.services) {
  process.stdout.write(`${svc.service}\n`);
}
NODE
)

echo "Frasberg ECS mesh deployment request completed for ${CLUSTER_NAME}."
