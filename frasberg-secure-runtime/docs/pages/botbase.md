# BotBase workers

BotBase worker requests use `Authorization: Bearer <BOTBASE_SHARED_TOKEN>` and a
bounded `x-tenant-id`. Configure secrets with the platform secret manager; do not
put them in `wrangler.toml` variables.

`POST /manifest-compilation` accepts `{ "manifest": { ... } }`. It binds the
manifest to the authenticated tenant and returns the normalized payload plus an
HMAC-SHA-256 signature created with `BOTBASE_SIGNING_SECRET`. Consumers must
verify the signature over canonical JSON (object keys sorted recursively) before
trusting the payload.

`POST /core-signature` requires `{ "payload": ... }` and the same worker
authentication. Its signed value includes the authenticated tenant ID, so
clients cannot use the endpoint to request signatures for a different tenant.

The separate `infraIpListWorker` accepts authenticated `GET` requests and
returns only the configured `BOTBASE_INFRA_IP_CIDRS` IPv4 addresses/CIDRs. It
returns `503` if that configuration is absent or invalid; it does not publish a
hard-coded example list.

Other modules require real provider adapters (for example billing, DNS, CDN,
and secrets management). They return `501 Not Implemented` rather than echoing
requests or claiming simulated operations succeeded.
