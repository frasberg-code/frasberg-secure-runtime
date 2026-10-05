# Gateway

The gateway provides health, auth, OpenAI-compatible routing, queued job access, and Frasberg backend wrappers.

## GT6 and Studio routes

Authenticated endpoints include:

- `POST /api/emergent` and `GET /api/emergent/jobs*`
- `GET /api/gt6/:raceId/{cinematic,broadcast,live,export,keyframes,analytics,story,camera}`
- `POST /api/gt6/:raceId/{camera,automation,export/mp4}` and `PUT /api/gt6/:raceId/story`
- `GET /api/exports/:jobId/status`
- `GET /api/creator/assets`, `GET /api/creator/licenses`, and creator write routes
- `GET /api/releases`; `POST /api/releases/new` requires `governance:admin` and a configured `GITHUB_RELEASE_TOKEN`

Race snapshots/replay and creator/job metadata use DynamoDB. Export files use a
private S3 bucket and presigned download URLs. Studio is served from the gateway
root in the production container. LiveKit video, payment processing, and
actual GT6 frame/audio rendering are not implemented; placeholder renders are
explicitly identified in export status.

## Frasberg backend routes

- `POST /api/music`
- `POST /api/video`
- `POST /api/stt`
- `POST /api/tts`
- `POST /api/audio`
- `GET /api/jobs/:id`

All Frasberg calls are backend-to-backend only and use environment-provided bearer keys.

## Gateway-server trust boundary

- `apps/gateway-server` verifies JWT signature, expiry, issuer, and audience.
- Admin authorization is based on a trusted server-side role lookup keyed by `sub` (`GATEWAY_ROLE_LOOKUP_URL`); it does not trust a client-provided JWT `role` claim.
- Production routing requires `GATEWAY_ENGINE_BASE_URL` and forwards generation jobs to that backend. The in-memory engine adapter remains local/test-only.

## WorldGraph runtime API

- `POST /v1/worldgraph` validates a `WorldDefinition` payload from `@frasberg/full-game-stack-schema`, writes it through the persistent WorldGraph RPC service, and audit-logs the mutation.
- `GET /v1/worldgraph` returns owner-scoped paginated results with `page`, `pageSize`, `total`, and `items`.
- `GET /v1/worldgraph/:id`, `PATCH /v1/worldgraph/:id`, and `DELETE /v1/worldgraph/:id` are authenticated and owner-scoped.
- Gateway WorldGraph persistence uses authenticated Supabase RPC calls configured by `GATEWAY_WORLDGRAPH_SUPABASE_URL` and `GATEWAY_WORLDGRAPH_SUPABASE_ANON_KEY`; application code does not perform direct table access.
