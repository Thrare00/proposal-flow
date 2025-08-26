import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types'
    })
  ],
  base: command === 'build' ? '/proposal-flow/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.ico'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:1605',
        changeOrigin: true
      }
    },
    cors: true
  }
}));