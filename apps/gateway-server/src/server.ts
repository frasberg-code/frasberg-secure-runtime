import {
  buildGatewayServerApp,
  InMemoryFakeEngineAdapter,
  InMemoryRoleStore,
} from './app';

async function start() {
  const app = buildGatewayServerApp({
    jwt: {
      secret: process.env.GATEWAY_JWT_SECRET ?? 'dev-only-secret',
      issuer: process.env.GATEWAY_JWT_ISSUER ?? 'frasberg-runtime',
      audience: process.env.GATEWAY_JWT_AUDIENCE ?? 'frasberg-gateway',
    },
    roleStore: new InMemoryRoleStore({
      [process.env.GATEWAY_ADMIN_SUB ?? 'admin-dev-sub']: 'admin',
    }),
    engineAdapter: new InMemoryFakeEngineAdapter(),
  });

  const port = Number(process.env.PORT ?? '4100');
  await app.listen({ port, host: '0.0.0.0' });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
