# Deployment and authorization boundaries

## What belongs in GitHub

This repository contains source code, API contracts, deployment templates, migrations, tests, and secret-free configuration. It must not contain production API keys, JWT secrets, service-role keys, database passwords, model weights, or live engine binaries.

## Where APIs and engines run

The gateway and runtime-router packages are deployable backend services. Real music, video, image, voice, STT, and TTS engines are external adapters or separately deployed services. Configure their URLs and credentials through the deployment platform’s secret manager; the repository includes no production-engine claim or embedded secret.

Supabase stores authenticated users, owner-scoped metadata, jobs, usage, policies, audit records, and monitoring snapshots. It is not a runtime host for GPU engines and must not be used as a secret store for engine credentials.

## Authorization for control-plane changes

Admin control-plane operations must pass all of these boundaries:

1. The gateway verifies the bearer token signature, expiry, issuer, and audience.
2. The gateway resolves the user role from trusted server-side storage rather than trusting a mutable request field.
3. Admin routes require the resolved role to be `admin`.
4. Governance updates validate thresholds through `GovernanceEngine`.
5. Mutations are recorded by the gateway audit store.
6. Database maintenance functions use `SECURITY DEFINER` plus system/admin guards; pg_cron jobs run as trusted system work, not as end users.

JWT claims may identify a subject, but an admin claim alone must not be the source of truth for production authorization. Keep role promotion in a controlled server-side workflow and audit it.

## Secrets

Use the hosting platform’s environment/secrets manager for `SUPABASE_SERVICE_ROLE_KEY`, JWT verification secrets, database URLs, and engine credentials. Never put these values in SQL seed data, public tables, GitHub Actions logs, or committed `.env` files.

## Validation

```bash
npm ci
npm run build
npm run test
npm run validate:manifests
supabase db reset
supabase test db
```

The monitoring migration is optional with respect to `pg_cron`: it applies without the extension and logs a notice; enable `pg_cron` and call `call admin.install_monitoring_cron_jobs();` from a trusted deployment step to install schedules.
