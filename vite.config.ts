import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/proposal-flow/',
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.tsx',
      },
      output: {
        format: 'esm',
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
      preserveEntrySignatures: 'strict',
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.wasm'],
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  assetsDir: 'assets',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    global: 'window',
  },
  esbuild: {
    target: 'es2020',
    loader: 'tsx',
    jsx: 'react-jsx',
  },
  clearScreen: false,
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  envPrefix: 'VITE_',
  test: {
    globals: true,
    environment: 'jsdom',
  },
}));