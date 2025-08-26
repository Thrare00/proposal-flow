import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  base: '/proposal-flow/'
})
