var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// vite.config.js
import { defineConfig } from "file:///C:/project-backup/node_modules/vite/dist/node/index.js";
import react from "file:///C:/project-backup/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///C:/project-backup/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig(({ command }) => {
  const isProduction = command === "build";
  return {
    define: {
      global: "globalThis",
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
      "process.env": {}
    },
    plugins: [
      react(),
      nodePolyfills({
        include: ["crypto", "stream", "util", "buffer", "process"],
        protocolImports: true
      })
    ],
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: "globalThis"
        },
        // Enable esbuild polyfill plugins
        plugins: [
          {
            name: "fix-node-globals-polyfill",
            setup(build) {
              build.onResolve({ filter: /_virtual-process-polyfill_/ }, () => ({
                path: __require.resolve("process/browser")
              }));
            }
          }
        ]
      }
    },
    resolve: {
      alias: [
        {
          find: /^node:.*/,
          replacement: (val) => val.replace(/^node:/, "")
        },
        {
          find: "crypto",
          replacement: "crypto-browserify"
        },
        {
          find: "stream",
          replacement: "stream-browserify"
        },
        {
          find: "util",
          replacement: "util"
        },
        {
          find: "buffer",
          replacement: "buffer"
        },
        {
          find: "process",
          replacement: "process/browser"
        }
      ]
    },
    base: isProduction ? "/proposal-flow/" : "/",
    server: {
      port: 3007,
      strictPort: true,
      host: "0.0.0.0",
      open: true,
      cors: true,
      hmr: {
        host: "localhost",
        port: 3007,
        protocol: "ws"
      }
    },
    preview: {
      port: 3008,
      strictPort: true
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      copyPublicDir: true,
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js"
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxwcm9qZWN0LWJhY2t1cFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxccHJvamVjdC1iYWNrdXBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3Byb2plY3QtYmFja3VwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4ge1xuICBjb25zdCBpc1Byb2R1Y3Rpb24gPSBjb21tYW5kID09PSAnYnVpbGQnO1xuICBcbiAgcmV0dXJuIHtcbiAgICBkZWZpbmU6IHtcbiAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ3Byb2R1Y3Rpb24nKSxcbiAgICAgICdwcm9jZXNzLmVudic6IHt9XG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgbm9kZVBvbHlmaWxscyh7XG4gICAgICAgIGluY2x1ZGU6IFsnY3J5cHRvJywgJ3N0cmVhbScsICd1dGlsJywgJ2J1ZmZlcicsICdwcm9jZXNzJ10sXG4gICAgICAgIHByb3RvY29sSW1wb3J0czogdHJ1ZSxcbiAgICAgIH0pXG4gICAgXSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICAgIC8vIE5vZGUuanMgZ2xvYmFsIHRvIGJyb3dzZXIgZ2xvYmFsVGhpc1xuICAgICAgICBkZWZpbmU6IHtcbiAgICAgICAgICBnbG9iYWw6ICdnbG9iYWxUaGlzJyxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gRW5hYmxlIGVzYnVpbGQgcG9seWZpbGwgcGx1Z2luc1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2ZpeC1ub2RlLWdsb2JhbHMtcG9seWZpbGwnLFxuICAgICAgICAgICAgc2V0dXAoYnVpbGQpIHtcbiAgICAgICAgICAgICAgYnVpbGQub25SZXNvbHZlKHsgZmlsdGVyOiAvX3ZpcnR1YWwtcHJvY2Vzcy1wb2x5ZmlsbF8vIH0sICgpID0+ICh7XG4gICAgICAgICAgICAgICAgcGF0aDogcmVxdWlyZS5yZXNvbHZlKCdwcm9jZXNzL2Jyb3dzZXInKSxcbiAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmaW5kOiAvXm5vZGU6LiovLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiAodmFsKSA9PiB2YWwucmVwbGFjZSgvXm5vZGU6LywgJycpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmluZDogJ2NyeXB0bycsXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6ICdjcnlwdG8tYnJvd3NlcmlmeScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBmaW5kOiAnc3RyZWFtJyxcbiAgICAgICAgICByZXBsYWNlbWVudDogJ3N0cmVhbS1icm93c2VyaWZ5JyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpbmQ6ICd1dGlsJyxcbiAgICAgICAgICByZXBsYWNlbWVudDogJ3V0aWwnLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmluZDogJ2J1ZmZlcicsXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6ICdidWZmZXInLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmluZDogJ3Byb2Nlc3MnLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiAncHJvY2Vzcy9icm93c2VyJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBiYXNlOiBpc1Byb2R1Y3Rpb24gPyAnL3Byb3Bvc2FsLWZsb3cvJyA6ICcvJyxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDMwMDcsXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgICAgaG9zdDogJzAuMC4wLjAnLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGNvcnM6IHRydWUsXG4gICAgICBobXI6IHtcbiAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgIHBvcnQ6IDMwMDcsXG4gICAgICAgIHByb3RvY29sOiAnd3MnXG4gICAgICB9XG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICBwb3J0OiAzMDA4LFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogJ2Rpc3QnLFxuICAgICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgIGNvcHlQdWJsaWNEaXI6IHRydWUsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nLFxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7O0FBQXlPLFNBQVMsb0JBQW9CO0FBQ3RRLE9BQU8sV0FBVztBQUNsQixTQUFTLHFCQUFxQjtBQUU5QixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFFBQVEsTUFBTTtBQUMzQyxRQUFNLGVBQWUsWUFBWTtBQUVqQyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixRQUFRO0FBQUEsTUFDUix3QkFBd0IsS0FBSyxVQUFVLFFBQVEsSUFBSSxZQUFZLFlBQVk7QUFBQSxNQUMzRSxlQUFlLENBQUM7QUFBQSxJQUNsQjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sY0FBYztBQUFBLFFBQ1osU0FBUyxDQUFDLFVBQVUsVUFBVSxRQUFRLFVBQVUsU0FBUztBQUFBLFFBQ3pELGlCQUFpQjtBQUFBLE1BQ25CLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixnQkFBZ0I7QUFBQTtBQUFBLFFBRWQsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFFBQ1Y7QUFBQTtBQUFBLFFBRUEsU0FBUztBQUFBLFVBQ1A7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLE1BQU0sT0FBTztBQUNYLG9CQUFNLFVBQVUsRUFBRSxRQUFRLDZCQUE2QixHQUFHLE9BQU87QUFBQSxnQkFDL0QsTUFBTSxVQUFRLFFBQVEsaUJBQWlCO0FBQUEsY0FDekMsRUFBRTtBQUFBLFlBQ0o7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYSxDQUFDLFFBQVEsSUFBSSxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQ2hEO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWE7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxNQUFNLGVBQWUsb0JBQW9CO0FBQUEsSUFDekMsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sS0FBSztBQUFBLFFBQ0gsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLE1BQ2YsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
