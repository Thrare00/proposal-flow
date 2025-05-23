import { defineConfig, loadEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { terser } from 'rollup-plugin-terser'

export default defineConfig(({ mode }): UserConfig => {
  const base = mode === 'production' ? '/' : '/'

  return {
    base,
    plugins: [
      react({
        babel: {
          plugins: ['@babel/plugin-transform-react-jsx']
        }
      }),
      {
        name: 'typescript-check',
        buildStart() {
          const { execSync } = require('child_process');
          try {
            execSync('tsc --noEmit --pretty', { stdio: 'inherit' });
          } catch (error) {
            console.error('TypeScript compilation failed. Please fix TypeScript errors before building.');
            process.exit(1);
          }
        }
      },
      mode === 'production' && terser({
        compress: {
          drop_console: true,
          drop_debugger: true,
          ecma: 2020,
          module: true,
          toplevel: true,
          warnings: false
        },
        mangle: {
          toplevel: true
        },
        output: {
          comments: false
        },
        format: {
          comments: false
        }
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: 'inline',
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
            vendor: ['react', 'react-dom', 'react-router-dom', 'scheduler']
          },
          sourcemap: true,
          compact: true
        }
      },
      assetsDir: 'assets',
      manifest: true,
      minify: 'terser',
      target: 'esnext',
      cssCodeSplit: true,
      commonjsOptions: {
        include: [/node_modules/]
      }
    },
    publicDir: 'public',
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'scheduler'],
      entries: ['react-dom/client', 'scheduler']
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