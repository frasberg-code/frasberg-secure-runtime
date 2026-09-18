import { buildApp } from './app';

const port = Number(process.env.RUNTIME_ROUTER_PORT ?? 4001);
const host = process.env.RUNTIME_ROUTER_HOST ?? '127.0.0.1';
const selfBaseUrl =
  process.env.RUNTIME_ROUTER_PUBLIC_URL ?? `http://${host}:${port}`;

buildApp({
  upstreamUrl: process.env.RUNTIME_UPSTREAM_URL,
  selfBaseUrl,
})
  .listen({ port, host })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
