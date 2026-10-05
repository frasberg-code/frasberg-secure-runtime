import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: [
      'packages/*/test/**/*.test.ts',
      'apps/*/test/**/*.test.ts',
      'sdk/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@frasberg/shared': path.resolve(
        __dirname,
        'packages/shared/src/index.ts',
      ),
      '@frasberg/full-game-stack-schema': path.resolve(
        __dirname,
        'packages/full-game-stack-schema/src/index.ts',
      ),
      '@frasberg/worldgraph-engine': path.resolve(
        __dirname,
        'packages/worldgraph-engine/src/index.ts',
      ),
      '@frasberg/builder-v2-orchestrator': path.resolve(
        __dirname,
        'packages/builder-v2-orchestrator/src/index.ts',
      ),
    },
  },
});
