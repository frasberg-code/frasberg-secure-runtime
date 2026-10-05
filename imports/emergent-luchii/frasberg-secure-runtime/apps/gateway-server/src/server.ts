import { buildGatewayServerApp, type EngineAdapter } from './app';
import {
  PersistentWorldGraphService,
  SupabaseRestRpcClientFactory,
} from '@frasberg/worldgraph-engine';

async function start() {
  const jwtSecret = readRequiredEnv('GATEWAY_JWT_SECRET');
  const roleLookupUrl = readRequiredEnv('GATEWAY_ROLE_LOOKUP_URL');
  const roleLookupToken = process.env.GATEWAY_ROLE_LOOKUP_TOKEN;
  const engineBaseUrl = readRequiredEnv('GATEWAY_ENGINE_BASE_URL');
  const worldGraphSupabaseUrl = readRequiredEnv(
    'GATEWAY_WORLDGRAPH_SUPABASE_URL',
  );
  const worldGraphSupabaseAnonKey = readRequiredEnv(
    'GATEWAY_WORLDGRAPH_SUPABASE_ANON_KEY',
  );
  const app = buildGatewayServerApp({
    jwt: {
      secret: jwtSecret,
      issuer: process.env.GATEWAY_JWT_ISSUER ?? 'frasberg-runtime',
      audience: process.env.GATEWAY_JWT_AUDIENCE ?? 'frasberg-gateway',
    },
    roleStore: {
      async getRole(userId: string) {
        const response = await fetch(
          `${roleLookupUrl}?sub=${encodeURIComponent(userId)}`,
          {
            headers: roleLookupToken
              ? { authorization: ['Bearer', roleLookupToken].join(' ') }
              : {},
          },
        );
        if (!response.ok) {
          return undefined;
        }
        const body = (await response.json()) as { role?: unknown };
        if (body.role === 'admin' || body.role === 'user') {
          return body.role;
        }
        return undefined;
      },
    },
    engineAdapter: remoteEngineAdapter(engineBaseUrl),
    worldGraphService: new PersistentWorldGraphService(
      new SupabaseRestRpcClientFactory({
        baseUrl: worldGraphSupabaseUrl,
        apiKey: worldGraphSupabaseAnonKey,
      }),
    ),
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

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} must be set.`);
  }

  return value;
}

function remoteEngineAdapter(baseUrl: string): EngineAdapter {
  return {
    async submitJob(domain, payload) {
      const response = await fetch(`${baseUrl}/v1/engines/${domain}/jobs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Engine backend request failed (${response.status}).`);
      }
      return (await response.json()) as Awaited<
        ReturnType<EngineAdapter['submitJob']>
      >;
    },
  };
}
