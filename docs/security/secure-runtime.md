# Secure runtime scaffold notes

## Important limits

This repository is a scaffold. It demonstrates local buildable services and safe worker patterns, but it does **not** claim that production Cloudflare, Kubernetes, registry, WAF, or signing infrastructure has been deployed or verified.

## Required external secrets

Provide secrets at runtime only:

- `FRASBERG_API_KEYS_JSON` for gateway API key definitions
- `BOTBASE_SHARED_TOKEN` for authenticated worker access
- `BOTBASE_SIGNING_SECRET` for signature workers
- Any future upstream provider secrets (for example OpenAI-compatible credentials) through deployment-specific secret stores

Do not commit those values, and do not place signing secrets in Wrangler vars. Use `wrangler secret put` or an equivalent secret manager.

## Corrected WAF logic

Access should be denied unless **all** required conditions are satisfied. Example conditions include:

- valid authentication presented
- required permission granted
- expected tenant identifier present
- request size and route policy within limits

A partial match is not sufficient; the default posture is deny.

## Production replacement points

- Replace the in-memory engine repository with durable queue/storage
- Replace placeholder generation responses with verified upstream providers
- Replace scaffold worker responses with audited implementations and fine-grained authz
- Add real deployment secrets through GitHub environments, Kubernetes secrets, or Cloudflare secret storage
