import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  resolve: {
    alias: {
      '@': './src'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.tsx'
      }
    },
    assetsDir: 'assets',
    assetsInlineLimit: 4096
  },
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true
    }
  }
});
