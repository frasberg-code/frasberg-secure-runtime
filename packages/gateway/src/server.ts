import { buildApp } from './app';

const port = Number(process.env.GATEWAY_PORT ?? 4000);
const host = process.env.GATEWAY_HOST ?? '0.0.0.0';

if (!process.env.RUNTIME_STATE_TABLE || !process.env.RUNTIME_ASSETS_BUCKET) {
  throw new Error(
    'RUNTIME_STATE_TABLE and RUNTIME_ASSETS_BUCKET must be configured for shared production state.',
  );
}

buildApp({
  runtimeRouterUrl: process.env.RUNTIME_ROUTER_URL,
  engineServiceUrl: process.env.ENGINE_SERVICE_URL,
})
  .listen({ port, host })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
