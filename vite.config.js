import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/proposal-flow/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Polyfill Node.js built-ins if needed
      util: 'util/',
      stream: 'stream-browserify',
      buffer: 'buffer/',
      crypto: 'crypto-browserify',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin()
      ],
    },
  },
  server: {
    port: Number(process.env.PORT || 3010),
    strictPort: true,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  }
});
