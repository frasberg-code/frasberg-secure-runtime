# LINQ Domain Architecture

This document defines the production domain architecture for LINQ under Frasberg, Inc.

## Domain roles

### Primary product domain: `fraslinq.com`
Public-facing domain for:
- Homepage and marketing pages
- Product landing pages
- Signup and login entry points
- Documentation and support
- Public status and API discovery

### Workspace domain: `linqworkspace.com`
Authenticated SaaS environment for:
- Dashboard and workspace UX
- Team features
- Admin panel
- Developer console
- Internal tooling
- Dev and beta environments

## Traffic separation policy

- Marketing/public content must live on `fraslinq.com`.
- App/workspace content must live on `linqworkspace.com`.
- Login/app/dashboard routes on `fraslinq.com` redirect to `linqworkspace.com`.
- Marketing routes on `linqworkspace.com` redirect to `fraslinq.com`.

## Canonical host policy

- `www.fraslinq.com` → `fraslinq.com`
- `www.linqworkspace.com` → `linqworkspace.com`
- HTTPS required everywhere.

## API domain

- Canonical API: `https://api.fraslinq.com`
- Versioned base paths:
  - `/v1`
  - `/v2`

## Subdomain map

### `fraslinq.com`
- `app.fraslinq.com` → workspace entry / alias
- `api.fraslinq.com` → backend gateway
- `docs.fraslinq.com` → developer docs
- `status.fraslinq.com` → uptime/status
- `cdn.fraslinq.com` → optional static assets CDN

### `linqworkspace.com`
- `dashboard.linqworkspace.com` → main app
- `workspace.linqworkspace.com` → main app
- `admin.linqworkspace.com` → admin panel
- `team.linqworkspace.com` → team workspace
- `console.linqworkspace.com` → developer console
- `dev.linqworkspace.com` → development environment
- `beta.linqworkspace.com` → beta environment

## Security and edge baseline

Cloudflare (recommended authoritative DNS + edge controls for both domains):
- SSL/TLS: Full (strict preferred once cert chain and origin certs are ready)
- Always Use HTTPS: ON
- WAF managed rules: ON
- Bot protection: ON
- Rate limiting:
  - `/auth/*`
  - `/api/*`
  - `/admin/*`

## Platform alignment

- Parent entity: **FRASBERG, INC**
- Public product: **LINQ** (`fraslinq.com`)
- SaaS workspace: **LINQ Workspace** (`linqworkspace.com`)
