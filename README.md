# frasberg-secure-runtime

Private Frasberg secure runtime and BotBase scaffold.

## What is included

- npm workspace-based Node/TypeScript monorepo
- Fastify gateway, runtime router, and engine/job services
- Shared auth, chat validation, and job lifecycle utilities
- Safe Cloudflare Worker scaffolds and BotBase manifests
- Docker, Compose, Kubernetes, Helm, and CI templates for local/manual use
- Focused tests for auth decisions, routing, and job transitions

## Quick start

```bash
npm ci
npm run build
npm run test
npm run validate:manifests
```

## Packages

- `@frasberg/shared` - shared types and validation helpers
- `@frasberg/engine` - bounded in-memory development job engine
- `@frasberg/runtime-router` - OpenAI-compatible `/v1/chat/completions` router
- `@frasberg/gateway` - auth-aware API gateway and placeholder media routes
- `@frasberg/botbase-workers` - authenticated, non-destructive Cloudflare Worker scaffolds

## Security model

- Runtime secrets are read only from environment variables.
- No real secrets, signing keys, kubeconfigs, or registry credentials are committed.
- BotBase signing workers fail closed if signing secrets are missing.
- DNS-related workers are plan-only by default and do not mutate infrastructure from HTTP requests.
- See `/docs/security/secure-runtime.md` for required external secrets and scaffold limitations.

## Running services locally

Examples:

```bash
node packages/engine/dist/server.js
node packages/runtime-router/dist/server.js
node packages/gateway/dist/server.js
```

Each service defaults to loopback addresses and internal URLs suitable for local development.
