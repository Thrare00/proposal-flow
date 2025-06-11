import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/proposal-flow/' : '/',
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
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true
    }
  }
});
