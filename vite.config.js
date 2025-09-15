import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/proposal-flow/',
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  resolve: { 
    alias: { 
      '@': path.resolve(__dirname, 'src'),
      // Polyfill for Node.js built-ins
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'util': 'util/',
      'buffer': 'buffer/',
    },
    // Prevent duplicate React copies
    dedupe: ['react', 'react-dom'],
    preserveSymlinks: false,
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: { 
    port: Number(process.env.PORT || 3010), 
    strictPort: true 
  },
  optimizeDeps: {
    include: ['react-window'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1024,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      external: ['crypto'],
    },
  },
});
