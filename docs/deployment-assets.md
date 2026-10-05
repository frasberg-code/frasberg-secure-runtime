# Deployment assets

The existing production deployment remains in `deploy.yml`; it calls the
reusable implementation in `deploy-production.yml`. Both use the production
settings already established by the ECS service: `us-west-2`, cluster
`frasberg-secure-runtime-cluster`, container port `4000`, and the resolving
health endpoint `https://runtime.aws.frasberg.com/health`.

`deploy/ecs-task.json` is the task-definition template consumed by that
workflow. Its secret references match the existing production Supabase URL and
anon-key secrets. The service-role key is deliberately not injected into this
gateway task because the current runtime only uses the anon key and a
service-role key bypasses Supabase row-level security.
The gateway task reads the governance admin and consolidated engine-key
secrets from Secrets Manager. The engine-key JSON maps its FRB_* fields to the
FRASBERG_* domain clients and fails on malformed JSON. The provider's observed
authorization scopes require the music engine key for music generation,
the music generation key for audio enhancement, the TTS-labeled key for STT,
and the STT-labeled key for TTS. Video uses `FRB_VIDEO_ENGINE_KEY`; image uses
`FRB_IMAGE_VIDEO_GENERATION_KEY`; voice uses `FRB_VOICE_CLONING_KEY`. Provider
submission routes are configured through the matching `FRASBERG_*_URL` task
environment variables so each engine uses its explicit provider endpoint.
The provider's own application uses `/api/audio/tools/enhance`,
`/api/voice/transcribe`, and `/api/voice/speak` for audio enhancement,
transcription, and speech generation respectively; the production task uses
those exact routes. STT requests to this gateway must upload an audio file as
`multipart/form-data`.

## Shared runtime state and Studio

`infra/aws/runtime-storage.yaml` provisions the private S3 bucket,
DynamoDB table, and ECS task role used by GT6 state, replay frames, Studio
stories/camera selections, creator records, and export-job status. The
production stack `frasberg-secure-runtime-storage` has been deployed in
`us-west-2`. Its outputs are injected as `RUNTIME_STATE_TABLE` and
`RUNTIME_ASSETS_BUCKET`, and the ECS task definition uses the
`frasberg-secure-runtime-task` role. The S3 bucket blocks public access;
completed export jobs return short-lived presigned download URLs.

The gateway image builds `studio/` and serves its Vite output from the same
origin as the `/api` routes. Studio CI checks the frontend build, and the ECS
image build repeats it before deployment. The container includes FFmpeg and
uses 1 GiB of memory. The current FFmpeg worker still emits a color placeholder
because no GT6 rendered-frame source or audio-mixing pipeline exists yet; Studio
labels that output instead of presenting it as race footage.

GitHub releases are listed through `GET /api/releases`. Publishing from Studio
requires a dedicated `GITHUB_RELEASE_TOKEN` secret with release-write access;
the production task does not currently receive that token. Releases can still
be published by the repository's authorized GitHub maintainers.

`infra/iam/frasberg-secure-runtime-role.json` is an IAM permissions policy for
the ECS task execution role, which retrieves task-definition secrets and
writes container logs. It is not a trust policy and should not be attached to
the GitHub deploy role. It scopes secret access to the runtime's Supabase, engine-key, and
governance-admin secrets and log writes to its CloudWatch log group.
`infra/iam/apply-runtime-policy.sh` resolves the current AWS account ID and
applies this policy to the existing ECS execution role. Its secret access is
limited to the named runtime secrets; add a task-definition reference only
after the corresponding secret exists.

The Supabase secret setup script can create or update a consolidated secret
from environment variables, but it does not print their values. The current
task definition continues to use the existing separate URL and anon-key
secrets; creating the consolidated secret does not switch production to it.
The RPC health test intentionally uses an authenticated user access token; the
WorldGraph RPCs require `auth.uid()` and therefore cannot be tested with an
anon or service-role token alone.

The component health scripts use the actual routes exposed by this repository:

- Gateway server: `:4100/v1/health`
- Runtime router: `:4001/health`
- Engine: `:4002/v1/health`
- WorldGraph RPC: `rpc_list_worldgraph_definitions`

Override component URLs and health paths through the environment when testing
non-local deployments. `infra/network/security-group.sh` requires the ALB
security-group ID and only opens the task port to that security group; it does
not create public ingress rules.

The gateway loads per-domain RPM and burst limits from
`config/api-quotas.json`. These token-bucket limits are scoped to the tenant
when available and otherwise to the API key, and are held in gateway-process
memory. Governance settings are loaded from `config/governance.json` locally
and `config/governance-production.json` in the production container. The
`/v1/governance/*` endpoints require an API key with the
`governance:admin` permission. Policy-cycle requests report evaluation results;
they do not block media requests.

Infrastructure changes are explicit operations, not part of application
deployment. `infra/ecs/apply-autoscaling.sh`,
`infra/cloudwatch/put-dashboard.sh`, and `infra/ecr/apply-replication.sh`
apply their adjacent JSON configurations. The multi-region cluster helper
creates only the clusters listed in `infra/ecs/multi-region-clusters.json`.
Route 53 latency changes require every region in
`infra/route53/latency-routing.json` to be marked ready; the apply script then
verifies each public ALB, issued and attached certificate, and healthy target
group before replacing a simple A alias with latency aliases. The current
configuration keeps regions without a confirmed runtime service and TLS
endpoint disabled.
