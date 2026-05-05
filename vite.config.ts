import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const devBackendUrl = process.env.VITE_DEV_API_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      "/api/goals": {
        target: devBackendUrl,
        changeOrigin: true,
      },
      "/api": {
        target: devBackendUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
