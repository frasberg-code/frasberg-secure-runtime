# LINQ Routing Rules

## Public domain (`fraslinq.com`) routes

### Content routes (served on public domain)
- `/`
- `/signup`
- `/docs`
- `/support`
- `/status`

### Redirect routes (to workspace domain)
- `/login*` → `https://linqworkspace.com`
- `/app*` → `https://linqworkspace.com`
- `/dashboard*` → `https://linqworkspace.com`
- `/workspace*` → `https://linqworkspace.com`

## Workspace domain (`linqworkspace.com`) routes

### App routes (served on workspace domain)
- `/`
- `/dashboard`
- `/workspace`
- `/admin`
- `/team`
- `/console`
- `/dev`
- `/beta`

### Redirect routes (to public domain)
- `/pricing*` → `https://fraslinq.com/pricing`
- `/about*` → `https://fraslinq.com/about`
- `/features*` → `https://fraslinq.com/features`

## Status codes

- Use **308 Permanent Redirect** for canonical domain redirects.
- Use **307 Temporary Redirect** only for short-lived migrations/testing.

## SEO and canonical policy

- Public marketing pages canonicalize to `fraslinq.com`.
- App pages canonicalize to `linqworkspace.com`.
- Avoid duplicated public content on workspace domain.
