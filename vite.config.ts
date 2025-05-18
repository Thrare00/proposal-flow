import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/proposal-flow/' : '/'

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          main: './index.html'
        },
        output: {
          format: 'esm',
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      }
    }
  }
})