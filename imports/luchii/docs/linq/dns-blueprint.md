# LINQ DNS Blueprint

This file provides a reference DNS blueprint for production setup.

> Note: Values should be adjusted to exact provider requirements and validated in Cloudflare before go-live.

## `fraslinq.com` (public site)

### A records (Squarespace)

```txt
fraslinq.com  A  198.185.159.144
fraslinq.com  A  198.185.159.145
fraslinq.com  A  198.49.23.144
fraslinq.com  A  198.49.23.145
```

### CNAME records

```txt
www     CNAME  fraslinq.com
app     CNAME  linqworkspace.com
login   CNAME  linqworkspace.com
docs    CNAME  docs-host.example.com
api     CNAME  api-gateway.example.com
status  CNAME  statuspage.io
```

> Replace placeholder targets (`docs-host.example.com`, `api-gateway.example.com`) with the actual providers.

## `linqworkspace.com` (workspace app)

### Apex A record

Use one based on hosting provider:

```txt
# Vercel
linqworkspace.com  A  76.76.21.21

# Netlify alternative
linqworkspace.com  A  104.198.14.52
```

### CNAME records

```txt
www        CNAME  linqworkspace.com
dashboard  CNAME  linqworkspace.com
workspace  CNAME  linqworkspace.com
admin      CNAME  linqworkspace.com
team       CNAME  linqworkspace.com
console    CNAME  linqworkspace.com
dev        CNAME  dev-host.example.com
beta       CNAME  beta-host.example.com
```

> Replace `dev-host.example.com` and `beta-host.example.com` with real environment hosts.

## Cloudflare proxy guidance

- Proxy ON (orange cloud) for web routes/subdomains.
- Consider DNS-only for provider constraints where required (for example certain verification records).
- Keep API proxy strategy aligned with gateway/WAF architecture.
