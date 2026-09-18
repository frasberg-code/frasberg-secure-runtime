import { buildApp } from './app';

const port = Number(process.env.GATEWAY_PORT ?? 4000);
const host = process.env.GATEWAY_HOST ?? '127.0.0.1';

buildApp({
  runtimeRouterUrl: process.env.RUNTIME_ROUTER_URL,
  engineServiceUrl: process.env.ENGINE_SERVICE_URL,
})
  .listen({ port, host })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
