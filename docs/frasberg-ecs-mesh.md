# Frasberg ECS mesh

This runtime exposes a sovereign mesh of internal service endpoints for the Frasberg secure runtime. Each service keeps a durable health endpoint and sits behind its own ALB target group.

## Health contract

Every service must expose:

- GET /health
- HTTP 200 with body `OK`

This keeps ECS tasks healthy, passes ALB health checks, preserves zero-downtime service deployments, and allows auto-scaling to keep the mesh stable.

## Service map

The runtime service catalog is generated from the authoritative map below:

```ts
export const SERVICES = [
  'auth', 'compute', 'core', 'data', 'queue', 'cache', 'search', 'events', 'notify',
  'billing', 'identity', 'profile', 'preferences', 'sessions', 'state', 'presence',
  'activity', 'history', 'timeline', 'feed', 'stream', 'sync', 'merge', 'aggregate',
  'reduce', 'fold', 'compress', 'pack', 'bundle', 'wrap', 'seal', 'finalize',
  'deliver', 'dispatch', 'route', 'relay', 'transmit', 'broadcast', 'multicast',
  'fanout', 'spread', 'diffuse', 'propagate', 'radiate', 'beam', 'pulse', 'wave',
  'ripple', 'echo', 'resonate', 'amplify', 'boost', 'surge', 'flare', 'flash',
] as const;
```

The corresponding route URLs are generated as:

```ts
https://${service}.aws.frasberg.com
```

Each service can be called through the typed router helper in the runtime package.
