import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/proposal-flow/' : '/'

  return {
    base,
    plugins: [react({
      babel: {
        plugins: ['@babel/plugin-transform-react-jsx']
      }
    })],
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
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      assetsDir: 'assets',
      manifest: true,
      minify: 'terser'
    },
    publicDir: 'public'
  }
})