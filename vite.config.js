import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    plugins: [react()],
    base: isProduction ? '/proposal-flow/' : '/',
    server: {
      port: 3007,
      strictPort: true,
      host: '0.0.0.0',
      open: true,
      cors: true,
      hmr: {
        host: 'localhost',
        port: 3007,
        protocol: 'ws'
      }
    },
    preview: {
      port: 3008,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true
    }
  };
})
