import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/proposal-flow/',
  plugins: [react()],
  server: {
    port: Number(process.env.PORT || 3012),
    strictPort: true,
  },
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 1024,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-lib': ['lucide-react'],
        },
      },
    },
  },
  define: {
    'import.meta.env.BASE_URL': JSON.stringify('/proposal-flow/'),
  },
});
