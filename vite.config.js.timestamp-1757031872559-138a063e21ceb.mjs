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
import { resolve } from "path";
var __vite_injected_original_dirname = "C:\\project-backup";
var vite_config_default = defineConfig(({ command }) => {
  const isProduction = command === "build";
  return {
    define: {
      global: "globalThis",
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
      "process.env": {}
    },
    plugins: [
      react({
        include: "**/*.jsx"
      }),
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
          find: "@",
          replacement: resolve(__vite_injected_original_dirname, "src")
        },
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxwcm9qZWN0LWJhY2t1cFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxccHJvamVjdC1iYWNrdXBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3Byb2plY3QtYmFja3VwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4ge1xuICBjb25zdCBpc1Byb2R1Y3Rpb24gPSBjb21tYW5kID09PSAnYnVpbGQnO1xuICBcbiAgcmV0dXJuIHtcbiAgICBkZWZpbmU6IHtcbiAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ3Byb2R1Y3Rpb24nKSxcbiAgICAgICdwcm9jZXNzLmVudic6IHt9XG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIGluY2x1ZGU6ICcqKi8qLmpzeCcsXG4gICAgICB9KSxcbiAgICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgICBpbmNsdWRlOiBbJ2NyeXB0bycsICdzdHJlYW0nLCAndXRpbCcsICdidWZmZXInLCAncHJvY2VzcyddLFxuICAgICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgICB9KVxuICAgIF0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgICAvLyBOb2RlLmpzIGdsb2JhbCB0byBicm93c2VyIGdsb2JhbFRoaXNcbiAgICAgICAgZGVmaW5lOiB7XG4gICAgICAgICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIEVuYWJsZSBlc2J1aWxkIHBvbHlmaWxsIHBsdWdpbnNcbiAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdmaXgtbm9kZS1nbG9iYWxzLXBvbHlmaWxsJyxcbiAgICAgICAgICAgIHNldHVwKGJ1aWxkKSB7XG4gICAgICAgICAgICAgIGJ1aWxkLm9uUmVzb2x2ZSh7IGZpbHRlcjogL192aXJ0dWFsLXByb2Nlc3MtcG9seWZpbGxfLyB9LCAoKSA9PiAoe1xuICAgICAgICAgICAgICAgIHBhdGg6IHJlcXVpcmUucmVzb2x2ZSgncHJvY2Vzcy9icm93c2VyJyksXG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczogW1xuICAgICAgICB7XG4gICAgICAgICAgZmluZDogJ0AnLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmluZDogL15ub2RlOi4qLyxcbiAgICAgICAgICByZXBsYWNlbWVudDogKHZhbCkgPT4gdmFsLnJlcGxhY2UoL15ub2RlOi8sICcnKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpbmQ6ICdjcnlwdG8nLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnY3J5cHRvLWJyb3dzZXJpZnknLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZmluZDogJ3N0cmVhbScsXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6ICdzdHJlYW0tYnJvd3NlcmlmeScsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBmaW5kOiAndXRpbCcsXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6ICd1dGlsJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpbmQ6ICdidWZmZXInLFxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYnVmZmVyJyxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGZpbmQ6ICdwcm9jZXNzJyxcbiAgICAgICAgICByZXBsYWNlbWVudDogJ3Byb2Nlc3MvYnJvd3NlcicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAgYmFzZTogaXNQcm9kdWN0aW9uID8gJy9wcm9wb3NhbC1mbG93LycgOiAnLycsXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiAzMDA3LFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBwb3J0OiAzMDA3LFxuICAgICAgICBwcm90b2NvbDogJ3dzJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogMzAwOCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWVcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgICBjb3B5UHVibGljRGlyOiB0cnVlLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJyxcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7OztBQUF5TyxTQUFTLG9CQUFvQjtBQUN0USxPQUFPLFdBQVc7QUFDbEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBSHhCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQzNDLFFBQU0sZUFBZSxZQUFZO0FBRWpDLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLFFBQVE7QUFBQSxNQUNSLHdCQUF3QixLQUFLLFVBQVUsUUFBUSxJQUFJLFlBQVksWUFBWTtBQUFBLE1BQzNFLGVBQWUsQ0FBQztBQUFBLElBQ2xCO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsUUFDSixTQUFTO0FBQUEsTUFDWCxDQUFDO0FBQUEsTUFDRCxjQUFjO0FBQUEsUUFDWixTQUFTLENBQUMsVUFBVSxVQUFVLFFBQVEsVUFBVSxTQUFTO0FBQUEsUUFDekQsaUJBQWlCO0FBQUEsTUFDbkIsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLGdCQUFnQjtBQUFBO0FBQUEsUUFFZCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsUUFDVjtBQUFBO0FBQUEsUUFFQSxTQUFTO0FBQUEsVUFDUDtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sTUFBTSxPQUFPO0FBQ1gsb0JBQU0sVUFBVSxFQUFFLFFBQVEsNkJBQTZCLEdBQUcsT0FBTztBQUFBLGdCQUMvRCxNQUFNLFVBQVEsUUFBUSxpQkFBaUI7QUFBQSxjQUN6QyxFQUFFO0FBQUEsWUFDSjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhLFFBQVEsa0NBQVcsS0FBSztBQUFBLFFBQ3ZDO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYSxDQUFDLFFBQVEsSUFBSSxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQ2hEO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWE7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxNQUFNLGVBQWUsb0JBQW9CO0FBQUEsSUFDekMsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sS0FBSztBQUFBLFFBQ0gsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsZUFBZTtBQUFBLE1BQ2YsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
