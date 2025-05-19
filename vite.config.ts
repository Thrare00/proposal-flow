import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/proposal-flow/' : '/'

  return {
    base,
    plugins: [
      react({
        babel: {
          plugins: ['@babel/plugin-transform-react-jsx']
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
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
          entryFileNames: ({ name }) => `assets/${name}.js`,
          chunkFileNames: ({ name }) => `assets/${name}.js`,
          assetFileNames: ({ name }) => `assets/${name}[extname]`,
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom']
          }
        }
      },
      assetsDir: 'assets',
      manifest: true,
      minify: 'terser',
      target: 'esnext',
      cssCodeSplit: true,
      commonjsOptions: {
        include: [/node_modules/]
      },
      error: {
        includeStack: true,
        verbose: true
      }
    },
    publicDir: 'public',
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      entries: ['react-dom/client']
    },
    server: {
      port: 3000,
      open: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    }
  }
})