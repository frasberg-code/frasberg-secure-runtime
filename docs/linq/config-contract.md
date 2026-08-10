# LINQ Configuration Contract

This file captures shared environment variables expected by frontend and backend.

## Frontend

```env
VITE_API_BASE_URL=https://api.fraslinq.com/v1
VITE_APP_DOMAIN=https://linqworkspace.com
VITE_PUBLIC_SITE=https://fraslinq.com
```

## Backend

```env
NODE_ENV=production
PORT=4000

API_BASE_URL=https://api.fraslinq.com
PUBLIC_SITE_URL=https://fraslinq.com
WORKSPACE_SITE_URL=https://linqworkspace.com

DATABASE_URL=postgres://<user>:<password>@<host>:5432/<db>
SHADOW_DATABASE_URL=postgres://<user>:<password>@<host>:5432/<db_shadow>

JWT_SECRET=<replace>
JWT_REFRESH_SECRET=<replace>

REGION=us-west-2

CLOUDFLARE_ACCOUNT_ID=<replace>
CLOUDFLARE_API_TOKEN=<replace>
```

## Security notes

- Do not commit real secrets.
- Use provider secret managers and GitHub Actions encrypted secrets.
- Rotate JWT and provider credentials periodically.
