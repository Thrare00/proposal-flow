import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : process.env.VITE_BASE_URL || '/proposal-flow/',
  root: './',
  publicDir: 'public',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'esm',
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
      preserveEntrySignatures: 'strict',
    },
  },
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  assetsDir: 'assets',
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  },
  clearScreen: false,
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  envPrefix: 'VITE_'
}));
