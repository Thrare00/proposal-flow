import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_URL || '/proposal-flow/',
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 3012),
    strictPort: true,
  },
  build: {
    outDir: 'docs',              // <-- build to docs/
    chunkSizeWarningLimit: 1024,
  },
})
