# frasberg-secure-runtime

Private Node/TypeScript monorepo scaffold for Frasberg secure runtime, backend gateway routing, and BotBase worker integration.

## Security warning

- Never commit real keys, OAuth secrets, webhook secrets, or cloud credentials.
- Keep all real values in Render/Kubernetes/Secrets Manager (or equivalent secret management).
- This repository ships placeholders only.

## Workspace layout

- `apps/gateway-server` (secure JWT + admin-gated gateway server app)
- `apps/runtime-router` (runtime router entry wrappers)
- `apps/engine-server` (engine entry wrappers)
- `apps/frontend-studio` (backend-only CreativeStudio integration)
- `packages/shared` (shared auth/types + `FrasbergClient`/`FrasbergGateway`)
- `packages/full-game-stack-schema` (typed schema contracts + validators for worlds, apps, and sites)
- `packages/worldgraph-engine` (persistent WorldGraph RPC service contracts for Supabase-backed storage)
- `packages/builder-v2-orchestrator` (builder orchestration contracts and contract-test fixture)
- `packages/gateway`, `packages/runtime-router`, `packages/engine`, `packages/botbase-workers`
- `workers/botbase` (worker endpoint exports)
- `supabase/` (schema migrations, config, SQL checks)
- `docs/` and `manifests/` (security and template assets)

## Backend Frasberg routes

The backend gateway exposes:

- `POST /api/music`
- `POST /api/video`
- `POST /api/stt`
- `POST /api/tts`
- `POST /api/audio`
- `GET /api/jobs/:id`

The authenticated runtime gateway server also exposes owner-scoped WorldGraph APIs:

- `POST /v1/worldgraph`
- `GET /v1/worldgraph`
- `GET /v1/worldgraph/:id`
- `PATCH /v1/worldgraph/:id`
- `DELETE /v1/worldgraph/:id`

`POST` and `PATCH` accept `packages/full-game-stack-schema` `WorldDefinition` payloads and audit-log mutations through the existing gateway audit store.

All Frasberg calls use `https://frasberg.com/api` and attach an Authorization bearer token from domain keys:

- `FRASBERG_MUSIC_KEY`
- `FRASBERG_VIDEO_KEY`
- `FRASBERG_STT_KEY`
- `FRASBERG_TTS_KEY`
- `FRASBERG_AUDIO_KEY`

Music/video flows support job lifecycle polling (`queued -> running -> completed -> failed`) through `/api/jobs/:id`.

## Environment variables (placeholders only)

- `FRASBERG_API_KEYS_JSON`
- `RUNTIME_ROUTER_URL`
- `ENGINE_SERVICE_URL`
- `RUNTIME_UPSTREAM_URL`
- `FRASBERG_MUSIC_KEY`
- `FRASBERG_VIDEO_KEY`
- `FRASBERG_STT_KEY`
- `FRASBERG_TTS_KEY`
- `FRASBERG_AUDIO_KEY`
- `BOTBASE_SHARED_TOKEN`
- `BOTBASE_SIGNING_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI`
- `GITHUB_WEBHOOK_SECRET`
- `GATEWAY_WORLDGRAPH_SUPABASE_URL`
- `GATEWAY_WORLDGRAPH_SUPABASE_ANON_KEY`

See `.env.example` for placeholder values only.

## Local setup

```bash
npm ci
npm run build
npm run test
npm run validate:manifests
```

For Supabase-backed WorldGraph persistence, apply `supabase/migrations/*.sql` and then run the SQL checks in `supabase/tests/*.sql` in a local Supabase/Postgres environment or CI job.

## Local dev scaffolds

- Dockerfiles in `packages/*/Dockerfile` are local scaffolds.
- `docker-compose.yml` is for local service wiring only.
- No production deployment claims are made in this repository.
