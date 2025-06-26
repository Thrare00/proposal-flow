import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import copy from 'rollup-plugin-copy'

declare module '*.svg' {
  const content: string;
  export default content;
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types'
    })
  ],
  // Base path for GitHub Pages deployment
  base: '/proposal-flow/',
  resolve: {
    alias: {
      '@': './src'
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      plugins: [
        copy({
          targets: [
            { src: '404.html', dest: 'dist' }
          ]
        })
      ]
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
