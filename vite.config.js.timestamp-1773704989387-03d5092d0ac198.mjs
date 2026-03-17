// vite.config.js
import { defineConfig } from "file:///mnt/c/Users/ericw/proposal-flow/proposal-flow/node_modules/vite/dist/node/index.js";
import react from "file:///mnt/c/Users/ericw/proposal-flow/proposal-flow/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/mnt/c/Users/ericw/proposal-flow/proposal-flow";
var vite_config_default = defineConfig(({ command }) => {
  const baseUrl = command === "serve" ? "/" : process.env.VITE_BASE_URL || "/proposal-flow/";
  return {
    base: baseUrl,
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: Number(process.env.PORT || 3012),
      strictPort: true
    },
    preview: {
      host: "0.0.0.0",
      port: 5010,
      strictPort: true
    },
    build: {
      outDir: "docs",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1024,
      sourcemap: true,
      rollupOptions: {
        input: {
          main: resolve(__vite_injected_original_dirname, "index.html")
        },
        output: {
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-lib": ["lucide-react"]
          }
        }
      }
    },
    define: {
      "import.meta.env.BASE_URL": JSON.stringify(baseUrl)
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvZXJpY3cvcHJvcG9zYWwtZmxvdy9wcm9wb3NhbC1mbG93XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvbW50L2MvVXNlcnMvZXJpY3cvcHJvcG9zYWwtZmxvdy9wcm9wb3NhbC1mbG93L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9tbnQvYy9Vc2Vycy9lcmljdy9wcm9wb3NhbC1mbG93L3Byb3Bvc2FsLWZsb3cvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiB7XG4gIGNvbnN0IGJhc2VVcmwgPSBjb21tYW5kID09PSAnc2VydmUnID8gJy8nIDogcHJvY2Vzcy5lbnYuVklURV9CQVNFX1VSTCB8fCAnL3Byb3Bvc2FsLWZsb3cvJztcblxuICByZXR1cm4ge1xuICAgIGJhc2U6IGJhc2VVcmwsXG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogJzAuMC4wLjAnLFxuICAgICAgcG9ydDogTnVtYmVyKHByb2Nlc3MuZW52LlBPUlQgfHwgMzAxMiksXG4gICAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIH0sXG4gICAgcHJldmlldzoge1xuICAgICAgaG9zdDogJzAuMC4wLjAnLFxuICAgICAgcG9ydDogNTAxMCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgb3V0RGlyOiAnZG9jcycsXG4gICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAyNCxcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgaW5wdXQ6IHtcbiAgICAgICAgICBtYWluOiByZXNvbHZlKF9fZGlybmFtZSwgJ2luZGV4Lmh0bWwnKVxuICAgICAgICB9LFxuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmpzJyxcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLmpzJyxcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2hhc2hdLltleHRdJyxcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgICAndWktbGliJzogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGRlZmluZToge1xuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5CQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KGJhc2VVcmwpLFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFQsU0FBUyxvQkFBb0I7QUFDelYsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUZ4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLFFBQVEsTUFBTTtBQUMzQyxRQUFNLFVBQVUsWUFBWSxVQUFVLE1BQU0sUUFBUSxJQUFJLGlCQUFpQjtBQUV6RSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTSxPQUFPLFFBQVEsSUFBSSxRQUFRLElBQUk7QUFBQSxNQUNyQyxZQUFZO0FBQUEsSUFDZDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLGFBQWE7QUFBQSxNQUNiLHVCQUF1QjtBQUFBLE1BQ3ZCLFdBQVc7QUFBQSxNQUNYLGVBQWU7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMLE1BQU0sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsUUFDdkM7QUFBQSxRQUNBLFFBQVE7QUFBQSxVQUNOLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFVBQ2hCLGNBQWM7QUFBQSxZQUNaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxZQUN6RCxVQUFVLENBQUMsY0FBYztBQUFBLFVBQzNCO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTiw0QkFBNEIsS0FBSyxVQUFVLE9BQU87QUFBQSxJQUNwRDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
