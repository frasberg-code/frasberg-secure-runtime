import { buildApp } from './app';

const port = Number(process.env.ENGINE_PORT ?? 4002);
const host = process.env.ENGINE_HOST ?? '127.0.0.1';

buildApp()
  .listen({ port, host })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
