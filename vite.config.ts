import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/proposal-flow/',
  plugins: [react()],
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
    minify: true,
    manifest: true,
    sourcemap: false,
    assetsDir: 'assets',
    assetsInlineLimit: 0
  },
  publicDir: 'public',
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '*.ico'],
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
  optimizeDeps: {
    include: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled']
  }
})
