// vite.config.js
import { defineConfig } from "file:///C:/project-backup/node_modules/vite/dist/node/index.js";
import react from "file:///C:/project-backup/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///C:/project-backup/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig(({ command }) => {
  const isProduction = command === "build";
  return {
    define: {
      global: "globalThis",
      "process.env": {}
    },
    plugins: [
      react(),
      nodePolyfills({
        // To add only specific polyfills, specify them here
        include: ["crypto", "stream", "util", "buffer", "process"],
        // Whether to polyfill `node:` protocol imports
        protocolImports: true
      })
    ],
    resolve: {
      alias: {
        crypto: "crypto-browserify",
        stream: "stream-browserify",
        util: "util",
        buffer: "buffer",
        process: "process/browser"
      }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxwcm9qZWN0LWJhY2t1cFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxccHJvamVjdC1iYWNrdXBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3Byb2plY3QtYmFja3VwL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW5vZGUtcG9seWZpbGxzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4ge1xuICBjb25zdCBpc1Byb2R1Y3Rpb24gPSBjb21tYW5kID09PSAnYnVpbGQnO1xuICBcbiAgcmV0dXJuIHtcbiAgICBkZWZpbmU6IHtcbiAgICAgIGdsb2JhbDogJ2dsb2JhbFRoaXMnLFxuICAgICAgJ3Byb2Nlc3MuZW52Jzoge31cbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgIHJlYWN0KCksXG4gICAgICBub2RlUG9seWZpbGxzKHtcbiAgICAgICAgLy8gVG8gYWRkIG9ubHkgc3BlY2lmaWMgcG9seWZpbGxzLCBzcGVjaWZ5IHRoZW0gaGVyZVxuICAgICAgICBpbmNsdWRlOiBbJ2NyeXB0bycsICdzdHJlYW0nLCAndXRpbCcsICdidWZmZXInLCAncHJvY2VzcyddLFxuICAgICAgICAvLyBXaGV0aGVyIHRvIHBvbHlmaWxsIGBub2RlOmAgcHJvdG9jb2wgaW1wb3J0c1xuICAgICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgICB9KVxuICAgIF0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgY3J5cHRvOiAnY3J5cHRvLWJyb3dzZXJpZnknLFxuICAgICAgICBzdHJlYW06ICdzdHJlYW0tYnJvd3NlcmlmeScsXG4gICAgICAgIHV0aWw6ICd1dGlsJyxcbiAgICAgICAgYnVmZmVyOiAnYnVmZmVyJyxcbiAgICAgICAgcHJvY2VzczogJ3Byb2Nlc3MvYnJvd3NlcicsXG4gICAgICB9LFxuICAgIH0sXG4gICAgYmFzZTogaXNQcm9kdWN0aW9uID8gJy9wcm9wb3NhbC1mbG93LycgOiAnLycsXG4gICAgc2VydmVyOiB7XG4gICAgICBwb3J0OiAzMDA3LFxuICAgICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICBjb3JzOiB0cnVlLFxuICAgICAgaG1yOiB7XG4gICAgICAgIGhvc3Q6ICdsb2NhbGhvc3QnLFxuICAgICAgICBwb3J0OiAzMDA3LFxuICAgICAgICBwcm90b2NvbDogJ3dzJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgcG9ydDogMzAwOCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWVcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgICBjb3B5UHVibGljRGlyOiB0cnVlLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJyxcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU8sU0FBUyxvQkFBb0I7QUFDdFEsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBRTlCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsUUFBUSxNQUFNO0FBQzNDLFFBQU0sZUFBZSxZQUFZO0FBRWpDLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLFFBQVE7QUFBQSxNQUNSLGVBQWUsQ0FBQztBQUFBLElBQ2xCO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixjQUFjO0FBQUE7QUFBQSxRQUVaLFNBQVMsQ0FBQyxVQUFVLFVBQVUsUUFBUSxVQUFVLFNBQVM7QUFBQTtBQUFBLFFBRXpELGlCQUFpQjtBQUFBLE1BQ25CLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFBQSxJQUNBLE1BQU0sZUFBZSxvQkFBb0I7QUFBQSxJQUN6QyxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixLQUFLO0FBQUEsUUFDSCxNQUFNO0FBQUEsUUFDTixNQUFNO0FBQUEsUUFDTixVQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUEsTUFDWCxlQUFlO0FBQUEsTUFDZixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
