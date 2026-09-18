import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@frasberg/shared': path.resolve(
        __dirname,
        'packages/shared/src/index.ts',
      ),
    },
  },
});
