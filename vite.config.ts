import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/me": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/groups": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/registers": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/challenges": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
