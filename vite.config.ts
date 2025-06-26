import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': './src'
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        index: './index.html'
      },
      output: {
        entryFileNames: `[name].[hash].js`,
        chunkFileNames: `[name].[hash].js`,
        assetFileNames: `[name].[hash][extname]`
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
