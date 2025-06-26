import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/proposal-flow/',
    define: {
      'process.env.VITE_BASE_PATH': JSON.stringify(env.VITE_BASE_PATH || '/proposal-flow/')
    },
    server: {
      port: 3000
    },
    build: {
      outDir: './dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: './index.html'
        },
        output: {
          format: 'esm',
          entryFileNames: '[name].[hash].js',
          chunkFileNames: '[name].[hash].js',
          assetFileNames: '[name].[hash][extname]'
        }
      }
    },
    publicDir: 'public',
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
})
