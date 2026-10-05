import { buildWorldGraphRuntimeApp } from './worldgraph-runtime';

const port = Number(process.env.WORLDGRAPH_RUNTIME_PORT ?? 4100);
const host = process.env.WORLDGRAPH_RUNTIME_HOST ?? '0.0.0.0';

buildWorldGraphRuntimeApp()
  .listen({ port, host })
  .then(() => {
    const mode = process.env.FRASBERG_PLATFORM_URL
      ? `platform (${process.env.FRASBERG_PLATFORM_URL})`
      : 'in-memory';
    console.log(`WorldGraph runtime listening on ${host}:${port} — backing store: ${mode}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
