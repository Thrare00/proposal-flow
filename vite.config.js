import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const base = '/proposal-flow/'; // required for GitHub Pages under thrare00.github.io/proposal-flow
  const port = Number(process.env.PORT || 3010);
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    server: {
      port,
      strictPort: true,
    },
    build: { chunkSizeWarningLimit: 1024 },
  };
});
