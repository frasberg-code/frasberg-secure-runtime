import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, './server'),
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/ws': {
        target:    'ws://localhost:3001',
        ws:        true,
        changeOrigin: true,
      },
      '/health': {
        target:    'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir:        'dist',
    assetsDir:     'assets',
    sourcemap:     false,
    minify:        'terser',
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          vendor: ['three'],
          engine: ['./src/GameEngine.js'],
          systems: [
            './src/CarController.js',
            './src/TrafficAI.js',
            './src/NPCSystem.js',
            './src/CarjackSystem.js',
          ],
          ui: ['./src/HUD.js', './src/WorldMap.js'],
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  }
});
