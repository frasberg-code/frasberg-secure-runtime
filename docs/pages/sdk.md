# Frasberg SDKs

The TypeScript SDK is in `sdk/typescript`; the dependency-free Python client is
in `sdk/python`. Both use the runtime's bearer API-key authentication and sign
JSON request bodies with HMAC-SHA-256. The gateway verifies a supplied
`x-api-signature` against the API key and parsed request body. Neither client
sends a client-asserted owner ID; tenant selection is optional and remains
validated by the server.

Configure one or more complete HTTP(S) API base URLs. GET and HEAD requests may
fail over across configured URLs on network failures and upstream 502/503/504
responses. POST requests are sent once only, so a transport failure cannot
silently duplicate job creation or other mutations.

Example:

```ts
import { Frasberg } from '../../sdk/typescript';

const client = new Frasberg({
  key: process.env.FRASBERG_API_KEY ?? '',
  tenantId: 'tenant-a',
  baseUrls: ['https://runtime.aws.frasberg.com'],
});

const health = await client.request('/v1/health');
```

Keep API keys in a secret manager or process environment; never embed live
credentials in browser bundles or source control.
