import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/proposal-flow/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { port: Number(process.env.PORT || 3010), strictPort: true },
  build: { chunkSizeWarningLimit: 1024 },
});
