import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const baseUrl = command === 'serve' ? '/' : process.env.VITE_BASE_URL || '/proposal-flow/';

  return {
    base: baseUrl,
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number(process.env.PORT || 3012),
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: 5010,
      strictPort: true,
    },
    build: {
      outDir: 'docs',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1024,
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-lib': ['lucide-react'],
          },
        },
      },
    },
    define: {
      'import.meta.env.BASE_URL': JSON.stringify(baseUrl),
    },
  };
});
