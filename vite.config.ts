import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outputDir: 'dist/types'
    })
  ],
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
    assetsDir: 'assets'
  },
  server: {
    port: 3000,
    open: true
  }
})
